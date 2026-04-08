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
import { DEFAULT_DEPARTMENT } from '../lib/constants'
import { uploadPdfToCloudinary } from '../lib/cloudinary'
import { extractProjectMetadataFromPdf } from '../features/projects/documentExtractionService'
import { createProject, getProjectById, updateProject } from '../features/projects/projectService'
import { listSupervisorProfiles } from '../features/auth/profileService'
import { useAppSelector } from '../hooks/useAppStore'
import { useDepartments } from '../hooks/useDepartments'
import { parseKeywordInput } from '../utils/parsers'
import type { ProjectInput } from '../types'

const statusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

export function UploadProjectPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const { departments } = useDepartments()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const editingId = searchParams.get('edit')

  const [form, setForm] = useState<ProjectInput>({
    title: '',
    abstract: '',
    keywords: [],
    department: DEFAULT_DEPARTMENT,
    year: new Date().getFullYear(),
    supervisor: '',
    supervisorUid: '',
    studentName: '',
    studentUid: '',
    fileUrl: '',
    filePublicId: '',
    status: 'pending',
  })
  const [keywordText, setKeywordText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extractionMessage, setExtractionMessage] = useState('')
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const [supervisorOptions, setSupervisorOptions] = useState<Array<{ value: string; label: string; name: string }>>([])
  const [loadingSupervisors, setLoadingSupervisors] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadRecord() {
      if (!editingId) {
        return
      }

      const record = await getProjectById(editingId)

      if (!record || !mounted) {
        return
      }

      setForm({
        title: record.title,
        abstract: record.abstract,
        keywords: record.keywords,
        department: record.department,
        year: record.year,
        supervisor: record.supervisor,
        supervisorUid: record.supervisorUid,
        studentName: record.studentName,
        studentUid: record.studentUid,
        fileUrl: record.fileUrl,
        filePublicId: record.filePublicId,
        status: record.status,
      })
      setKeywordText(record.keywords.join(', '))
    }

    void loadRecord()

    return () => {
      mounted = false
    }
  }, [editingId])

  useEffect(() => {
    if (departments.length === 0) {
      return
    }

    setForm((prev) => (departments.includes(prev.department) ? prev : { ...prev, department: departments[0] }))
  }, [departments])

  useEffect(() => {
    if (!profile?.fullName) {
      return
    }

    setForm((prev) => {
      if (profile.role === 'student') {
        return prev.studentName === profile.fullName && prev.studentUid === profile.uid
          ? prev
          : { ...prev, studentName: profile.fullName, studentUid: profile.uid }
      }

      return prev.studentName.trim() ? prev : { ...prev, studentName: profile.fullName }
    })
  }, [profile?.fullName, profile?.role, profile?.uid])

  useEffect(() => {
    if (profile?.role !== 'student') {
      return
    }

    setForm((prev) => {
      if (
        prev.supervisorUid === profile.assignedSupervisorUid
        && prev.supervisor === profile.assignedSupervisorName
      ) {
        return prev
      }

      return {
        ...prev,
        supervisorUid: profile.assignedSupervisorUid,
        supervisor: profile.assignedSupervisorName,
      }
    })
  }, [profile?.assignedSupervisorName, profile?.assignedSupervisorUid, profile?.role])

  useEffect(() => {
    let mounted = true

    async function loadSupervisors() {
      try {
        const users = await listSupervisorProfiles()
        const supervisors = users.map((user) => ({
          value: user.uid,
          label: user.fullName,
          name: user.fullName,
        }))

        if (mounted) {
          setSupervisorOptions(supervisors)

          setForm((prev) => {
            if (profile?.role === 'student') {
              return prev
            }

            if (prev.supervisorUid.trim()) {
              return prev
            }

            const matchedByName = supervisors.find((item) => item.name === prev.supervisor)
            const fallback = matchedByName || supervisors[0]

            if (!fallback) {
              return prev
            }

            return {
              ...prev,
              supervisorUid: fallback.value,
              supervisor: fallback.name,
            }
          })
        }
      } catch {
        if (mounted) {
          setSupervisorOptions([])
        }
      } finally {
        if (mounted) {
          setLoadingSupervisors(false)
        }
      }
    }

    void loadSupervisors()

    return () => {
      mounted = false
    }
  }, [profile?.role])

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
      if (profile?.role === 'student' && !profile.uploadCleared) {
        throw new Error('You can upload only after your supervisor/admin clears you.')
      }

      if (profile?.role === 'student' && !profile.assignedSupervisorUid.trim()) {
        throw new Error('Complete onboarding by selecting a supervisor before uploading.')
      }

      const keywords = parseKeywordInput(keywordText)
      const payload: ProjectInput = {
        ...form,
        keywords,
      }

      if (profile?.role === 'student') {
        payload.studentName = profile.fullName || payload.studentName
        payload.studentUid = profile.uid
        payload.supervisorUid = profile.assignedSupervisorUid
        payload.supervisor = profile.assignedSupervisorName
        payload.status = 'pending'
      }

      if (!payload.supervisorUid.trim() || !payload.supervisor.trim()) {
        throw new Error('Select a valid supervisor before saving this project.')
      }

      if (profile?.role === 'student' && !payload.studentUid.trim()) {
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
        title={editingId ? 'Edit project record' : 'Upload a new project record'}
        description="Store high-quality academic metadata and source PDFs for reliable institutional search and similarity analysis."
      />

      {profile?.role === 'student' && !profile.uploadCleared ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are currently pending supervisor/admin clearance. Upload is enabled once you are cleared.
        </p>
      ) : null}

      {profile?.role === 'student' && !profile.assignedSupervisorUid ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No supervisor is assigned to your profile yet. Complete onboarding before uploading a project.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Form mode</p>
            <FileUp size={16} className="text-teal-700" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-950">{editingId ? 'Editing' : 'Creating'}</p>
          <p className="mt-1 text-xs text-slate-500">{editingId ? 'Updating existing project metadata' : 'Adding a fresh project record'}</p>
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
                label={profile?.role === 'student' ? 'Student name (auto)' : 'Student name'}
                value={profile?.role === 'student' ? (profile.fullName || form.studentName) : form.studentName}
                onChange={(event) => setForm((prev) => ({ ...prev, studentName: event.target.value }))}
                disabled={profile?.role === 'student'}
                required
              />

              {profile?.role === 'student' ? (
                <Input
                  label="Supervisor"
                  value={profile.assignedSupervisorName || form.supervisor}
                  disabled
                  required
                />
              ) : loadingSupervisors ? (
                <Input
                  label="Supervisor"
                  value={form.supervisor}
                  onChange={(event) => setForm((prev) => ({ ...prev, supervisor: event.target.value }))}
                  placeholder="Loading supervisors..."
                  disabled
                  required
                />
              ) : supervisorOptions.length > 0 ? (
                <Select
                  label="Supervisor"
                  options={supervisorOptions}
                  value={form.supervisorUid}
                  onChange={(event) => {
                    const selected = supervisorOptions.find((item) => item.value === event.target.value)

                    if (!selected) {
                      return
                    }

                    setForm((prev) => ({
                      ...prev,
                      supervisorUid: selected.value,
                      supervisor: selected.name,
                    }))
                  }}
                  required
                />
              ) : (
                <Input
                  label="Supervisor"
                  value=""
                  placeholder="No supervisor accounts available"
                  disabled
                />
              )}

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

              {profile?.role === 'student' ? (
                <Input label="Status" value="pending" disabled />
              ) : (
                <Select
                  label="Status"
                  options={statusOptions}
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as ProjectInput['status'],
                    }))
                  }
                />
              )}
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

          {!loadingSupervisors && supervisorOptions.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              At least one supervisor account must exist before project submission.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              type="submit"
              disabled={
                loading
                || (!loadingSupervisors && supervisorOptions.length === 0)
                || (profile?.role === 'student' && !profile.uploadCleared)
                || (profile?.role === 'student' && !profile?.assignedSupervisorUid)
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
