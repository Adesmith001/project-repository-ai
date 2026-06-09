import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileUp, ShieldCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import FileUpload from '../components/ui/file-upload'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { SectionHeading } from '../components/ui/SectionHeading'
import { AREAS, DEFAULT_DEPARTMENT } from '../lib/constants'
import { uploadPdfToCloudinary } from '../lib/cloudinary'
import { extractProjectMetadataFromPdf } from '../features/projects/documentExtractionService'
import { listSupervisorProfiles } from '../features/auth/profileService'
import { buildSupervisorSuggestions, resolveSupervisorRouting, type SupervisorSuggestion } from '../features/auth/supervisorLookupService'
import { createProject, getProjectById, updateProject } from '../features/projects/projectService'
import { useAppSelector } from '../hooks/useAppStore'
import { useErrorToast } from '../hooks/useErrorToast'
import { useDepartments } from '../hooks/useDepartments'
import { getAuthorizedRole } from '../lib/authz'
import { parseKeywordInput } from '../utils/parsers'
import type { ProjectInput } from '../types'

const statusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending_supervisor', label: 'Pending (Supervisor)' },
  { value: 'pending_admin', label: 'Pending (Admin)' },
  { value: 'rejected', label: 'Rejected' },
]

export function UploadProjectPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const authorizedRole = getAuthorizedRole(profile)
  const { departments } = useDepartments()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const editingId = searchParams.get('edit')
  const resubmitFromId = searchParams.get('resubmitFrom')

  const [form, setForm] = useState<ProjectInput>({
    title: '',
    abstract: '',
    keywords: [],
    department: DEFAULT_DEPARTMENT,
    area: 'Both',
    year: new Date().getFullYear(),
    supervisor: '',
    supervisorUid: '',
    studentName: '',
    studentUid: '',
    fileUrl: '',
    filePublicId: '',
    fullText: '',
    status: 'pending_supervisor',
    rejectionReason: '',
  })
  const [keywordText, setKeywordText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extractionMessage, setExtractionMessage] = useState('')
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const [supervisorSuggestions, setSupervisorSuggestions] = useState<SupervisorSuggestion[]>([])

  useErrorToast(error)

  useEffect(() => {
    let mounted = true

    async function loadRecord() {
      const sourceProjectId = editingId || resubmitFromId

      if (!sourceProjectId) {
        return
      }

      try {
        const record = await getProjectById(sourceProjectId)

        if (!mounted) {
          return
        }

        if (!record) {
          setError('Unable to load the selected project record.')
          return
        }

        const isResubmitMode = !editingId && Boolean(resubmitFromId)

        setForm({
          title: record.title,
          abstract: record.abstract,
          keywords: record.keywords,
          department: record.department,
          area: record.area,
          year: record.year,
          supervisor: record.supervisor,
          supervisorUid: record.supervisorUid,
          studentName: record.studentName,
          studentUid: record.studentUid,
          fileUrl: isResubmitMode ? '' : record.fileUrl,
          filePublicId: isResubmitMode ? '' : record.filePublicId,
          fullText: isResubmitMode ? '' : record.fullText || '',
          status: isResubmitMode ? 'pending_supervisor' : record.status,
          rejectionReason: isResubmitMode ? '' : record.rejectionReason,
        })

        setKeywordText(record.keywords.join(', '))
        setSelectedFile(null)
        setUploadProgress(0)
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load project details.')
        }
      }
    }

    void loadRecord()

    return () => {
      mounted = false
    }
  }, [editingId, resubmitFromId])

  useEffect(() => {
    if (departments.length === 0) {
      return
    }

    setForm((prev) => (departments.includes(prev.department) ? prev : { ...prev, department: departments[0] }))
  }, [departments])

  useEffect(() => {
    let mounted = true

    async function loadSupervisorSuggestions() {
      try {
        const supervisors = await listSupervisorProfiles()

        if (mounted) {
          setSupervisorSuggestions(buildSupervisorSuggestions(supervisors))
        }
      } catch {
        if (mounted) {
          setSupervisorSuggestions([])
        }
      }
    }

    void loadSupervisorSuggestions()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!profile?.fullName) {
      return
    }

    setForm((prev) => {
      if (authorizedRole === 'student') {
        return prev.studentName === profile.fullName && prev.studentUid === profile.uid
          ? prev
          : { ...prev, studentName: profile.fullName, studentUid: profile.uid }
      }

      return prev.studentName.trim() ? prev : { ...prev, studentName: profile.fullName }
    })
  }, [authorizedRole, profile?.fullName, profile?.uid])

  useEffect(() => {
    if (!profile) {
      return
    }

    setForm((prev) => {
      if (authorizedRole === 'student') {
        if (prev.supervisor.trim() || prev.supervisorUid.trim()) {
          return prev
        }

        return {
          ...prev,
          supervisorUid: profile.assignedSupervisorUid,
          supervisor: profile.assignedSupervisorName,
        }
      }

      if (authorizedRole === 'supervisor') {
        return {
          ...prev,
          supervisorUid: profile.uid,
          supervisor: profile.fullName,
        }
      }

      return prev
    })
  }, [
    authorizedRole,
    profile,
    profile?.assignedSupervisorName,
    profile?.assignedSupervisorUid,
    profile?.fullName,
    profile?.uid,
  ])

  async function onUploadFilesChange(files: File[]) {
    const file = files[0] ?? null
    setSelectedFile(file)
    setExtractionMessage('')

    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF uploads are allowed in this version.')
      return
    }

    setError('')
    setExtractingMetadata(true)

    try {
      const extracted = await extractProjectMetadataFromPdf(file)
      const nextKeywords = extracted.keywords?.join(', ') || ''

      setForm((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : extracted.title || prev.title,
        abstract: prev.abstract.trim() ? prev.abstract : extracted.abstract || prev.abstract,
        fullText: extracted.fullText || prev.fullText || '',
      }))

      setKeywordText((prev) => (prev.trim() ? prev : nextKeywords))

      if (extracted.abstract || extracted.title || (extracted.keywords && extracted.keywords.length > 0)) {
        setExtractionMessage('Project details were extracted from your PDF and used to prefill empty fields.')
      } else {
        setExtractionMessage('File uploaded. No structured abstract/keywords were detected automatically.')
      }
    } catch {
      setExtractionMessage('File uploaded. Automatic extraction was unavailable for this document.')
    } finally {
      setExtractingMetadata(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authorizedRole === 'student' && !profile?.uploadCleared) {
        throw new Error('You can upload only after your supervisor/admin clears you.')
      }

      const keywords = parseKeywordInput(keywordText)
      const payload: ProjectInput = {
        ...form,
        keywords,
      }

      if (authorizedRole === 'student' && profile) {
        const routing = resolveSupervisorRouting(payload.supervisor, supervisorSuggestions)
        payload.studentName = profile.fullName || payload.studentName
        payload.studentUid = profile.uid
        payload.supervisorUid = routing.supervisorUid
        payload.supervisor = routing.supervisor
        payload.status = routing.status
        payload.rejectionReason = ''
      }

      if (authorizedRole === 'supervisor' && profile) {
        payload.supervisorUid = profile.uid
        payload.supervisor = profile.fullName || payload.supervisor
      }

      if (payload.status !== 'rejected') {
        payload.rejectionReason = ''
      }

      if (payload.status === 'rejected' && payload.rejectionReason.trim().length < 10) {
        throw new Error('Provide a rejection reason with at least 10 characters.')
      }

      if (!payload.supervisor.trim()) {
        throw new Error('Enter a supervisor name before saving this project.')
      }

      if (authorizedRole === 'student' && !payload.studentUid.trim()) {
        throw new Error('Student identity is missing. Please sign in again and retry.')
      }

      if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
          throw new Error('Only PDF uploads are allowed in this version.')
        }

        const uploadResult = await uploadPdfToCloudinary(selectedFile, setUploadProgress)
        payload.fileUrl = uploadResult.secureUrl
        payload.filePublicId = uploadResult.publicId
      }

      if (!payload.fileUrl || !payload.filePublicId) {
        throw new Error('Upload a PDF file before submitting.')
      }

      if (editingId) {
        await updateProject(editingId, payload)
      } else {
        await createProject(payload)
      }

      navigate('/projects', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save project.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Repository Curation"
        title={
          editingId
            ? 'Edit project record'
            : resubmitFromId
              ? 'Resubmit rejected project'
              : 'Upload a new project record'
        }
        description="Store high-quality academic metadata and source PDFs for reliable institutional search and similarity analysis."
      />

      {resubmitFromId ? (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Resubmission mode: metadata is prefilled from your rejected record. Upload a new PDF and submit again.
        </p>
      ) : null}

      {authorizedRole === 'student' && !profile?.uploadCleared ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are currently pending supervisor/admin clearance. Upload is enabled once you are cleared.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Form mode</p>
            <FileUp size={16} className="text-teal-700" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-950">{editingId ? 'Editing' : 'Creating'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {editingId
              ? 'Updating existing project metadata'
              : resubmitFromId
                ? 'Submitting a revised project record'
                : 'Adding a fresh project record'}
          </p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Upload progress</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{uploadProgress}%</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.max(uploadProgress, 2)}%` }}></div>
          </div>
        </Card>

        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">File readiness</p>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-950">{selectedFile || form.fileUrl ? 'Ready' : 'Missing PDF'}</p>
          <p className="mt-1 text-xs text-slate-500">PDF is mandatory before saving.</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Quality note</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Use concise keywords and explicit abstracts.</p>
          <p className="mt-1 text-xs text-slate-500">It improves retrieval quality for AI REPO similarity checks.</p>
        </Card>
      </div>

      <Card className="p-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="soft-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Core metadata</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input
                label="Project title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />

              <Input
                label={authorizedRole === 'student' ? 'Student name (auto)' : 'Student name'}
                value={authorizedRole === 'student' ? (profile?.fullName || form.studentName) : form.studentName}
                onChange={(event) => setForm((prev) => ({ ...prev, studentName: event.target.value }))}
                disabled={authorizedRole === 'student'}
                required
              />

              {authorizedRole === 'student' ? (
                <Input
                  label="Supervisor"
                  value={form.supervisor}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      supervisor: event.target.value,
                    }))
                  }
                  list="student-supervisor-suggestions"
                  placeholder="Type supervisor name"
                  required
                />
              ) : authorizedRole === 'supervisor' ? (
                <Input
                  label="Supervisor"
                  value={form.supervisor}
                  disabled
                  required
                />
              ) : (
                <Input
                  label="Supervisor"
                  value={form.supervisor}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      supervisor: event.target.value,
                      supervisorUid: '',
                    }))
                  }
                  placeholder="Type supervisor name"
                  required
                />
              )}

              {authorizedRole === 'student' ? (
                <datalist id="student-supervisor-suggestions">
                  {supervisorSuggestions.map((suggestion) => (
                    <option key={suggestion.uid} value={suggestion.name} />
                  ))}
                </datalist>
              ) : null}

              {authorizedRole === 'student' && form.supervisor.trim() ? (
                <p className="md:col-span-2 text-xs text-slate-500">
                  {resolveSupervisorRouting(form.supervisor, supervisorSuggestions).status === 'pending_supervisor'
                    ? 'Matched supervisor account found. This upload will go to supervisor review first.'
                    : 'No matching supervisor account found. This upload will go directly to admin review.'}
                </p>
              ) : null}

              <Input
                label="Year"
                type="number"
                min={2000}
                max={2100}
                value={form.year}
                onChange={(event) => setForm((prev) => ({ ...prev, year: Number(event.target.value) || prev.year }))}
                required
              />

              <Select
                label="Department"
                options={departments.map((item) => ({ value: item, label: item }))}
                value={form.department}
                onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
              />

              <Select
                label="Area"
                options={AREAS.map((item) => ({ value: item, label: item }))}
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
              />

              {authorizedRole === 'student' ? (
                <Input label="Status" value="Pending Supervisor" disabled />
              ) : (
                <Select
                  label="Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as ProjectInput['status'],
                      rejectionReason:
                        event.target.value === 'rejected'
                          ? prev.rejectionReason
                          : '',
                    }))
                  }
                />
              )}

              {authorizedRole !== 'student' && form.status === 'rejected' ? (
                <Textarea
                  label="Rejection reason"
                  value={form.rejectionReason}
                  onChange={(event) => setForm((prev) => ({ ...prev, rejectionReason: event.target.value }))}
                  placeholder="Explain why this project is rejected and what should be improved."
                  className="md:col-span-2"
                  required
                />
              ) : null}
            </div>
          </div>

          <div className="soft-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Research context</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input
                label="Keywords (comma-separated)"
                value={keywordText}
                onChange={(event) => setKeywordText(event.target.value)}
                className="md:col-span-2"
                required
              />

              <Textarea
                label="Abstract"
                value={form.abstract}
                onChange={(event) => setForm((prev) => ({ ...prev, abstract: event.target.value }))}
                className="md:col-span-2"
                required
              />
            </div>
          </div>

          <div className="soft-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Source document</p>
            <div className="mt-3">
              <FileUpload
                accept="application/pdf"
                multiple={false}
                onFilesChange={(files) => {
                  void onUploadFilesChange(files)
                }}
              />

              {uploadProgress > 0 ? (
                <p className="mt-2 text-xs text-slate-600">Upload progress: {uploadProgress}%</p>
              ) : null}

              {extractingMetadata ? (
                <p className="mt-2 text-xs text-blue-700">Extracting details from PDF...</p>
              ) : null}

              {extractionMessage ? (
                <p className="mt-2 text-xs text-slate-600">{extractionMessage}</p>
              ) : null}

              {form.fileUrl ? (
                <p className="mt-2 text-xs text-slate-500">Current file attached. Upload another PDF to replace it.</p>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              type="submit"
              disabled={
                loading
                || (authorizedRole === 'student' && !profile?.uploadCleared)
              }
            >
              {loading ? 'Saving...' : editingId ? 'Update project' : 'Create project'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
