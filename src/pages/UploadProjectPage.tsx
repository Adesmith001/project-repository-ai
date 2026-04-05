import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { DEPARTMENTS } from '../lib/constants'
import { uploadPdfToCloudinary } from '../lib/cloudinary'
import { createProject, getProjectById, updateProject } from '../features/projects/projectService'
import { parseKeywordInput } from '../utils/parsers'
import type { ProjectInput } from '../types'

const statusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

export function UploadProjectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const editingId = searchParams.get('edit')

  const [form, setForm] = useState<ProjectInput>({
    title: '',
    abstract: '',
    keywords: [],
    department: DEPARTMENTS[0],
    year: new Date().getFullYear(),
    supervisor: '',
    studentName: '',
    fileUrl: '',
    filePublicId: '',
    status: 'pending',
  })
  const [keywordText, setKeywordText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        studentName: record.studentName,
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const keywords = parseKeywordInput(keywordText)
      const payload: ProjectInput = {
        ...form,
        keywords,
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
    <Card>
      <h2 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit project record' : 'Upload new project'}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload PDF through Cloudinary unsigned preset and save metadata in Firestore.
      </p>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <Input
          label="Project title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />

        <Input
          label="Student name"
          value={form.studentName}
          onChange={(event) => setForm((prev) => ({ ...prev, studentName: event.target.value }))}
          required
        />

        <Input
          label="Supervisor"
          value={form.supervisor}
          onChange={(event) => setForm((prev) => ({ ...prev, supervisor: event.target.value }))}
          required
        />

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
          options={DEPARTMENTS.map((item) => ({ value: item, label: item }))}
          value={form.department}
          onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
        />

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

        <div className="md:col-span-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Project PDF (PDF only)</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          {uploadProgress > 0 ? (
            <p className="mt-1 text-xs text-slate-600">Upload progress: {uploadProgress}%</p>
          ) : null}

          {form.fileUrl ? (
            <p className="mt-1 text-xs text-slate-500">Current file attached. Upload another PDF to replace it.</p>
          ) : null}
        </div>

        {error ? (
          <p className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update project' : 'Create project'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
