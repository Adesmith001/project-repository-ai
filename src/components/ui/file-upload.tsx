import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import {
  CheckCircle,
  File as FileIcon,
  Loader,
  Trash2,
  UploadCloud,
} from 'lucide-react'

interface FileWithPreview {
  id: string
  preview: string
  progress: number
  name: string
  size: number
  type: string
  file: File
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
}

export default function FileUpload({
  accept = 'application/pdf',
  multiple = false,
  maxFiles = 1,
  onFilesChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
    }
  }, [files])

  function notifyParent(nextFiles: FileWithPreview[]) {
    onFilesChange?.(nextFiles.map((item) => item.file))
  }

  function simulateUpload(id: string) {
    let progress = 0
    const interval = window.setInterval(() => {
      progress += Math.random() * 18

      setFiles((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, progress: Math.min(progress, 100) }
            : item,
        ),
      )

      if (progress >= 100) {
        window.clearInterval(interval)
      }
    }, 200)
  }

  function handleFiles(fileList: FileList) {
    const incoming = Array.from(fileList)
    const scoped = multiple ? incoming : incoming.slice(0, 1)

    const normalized = scoped.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}`,
      preview: URL.createObjectURL(file),
      progress: 0,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }))

    const next = multiple
      ? [...files, ...normalized].slice(0, maxFiles)
      : normalized.slice(0, 1)

    if (!multiple) {
      files.forEach((file) => URL.revokeObjectURL(file.preview))
    }

    setFiles(next)
    notifyParent(next)
    normalized.forEach((item) => simulateUpload(item.id))
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function onDragLeave() {
    setIsDragging(false)
  }

  function onSelect(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      handleFiles(event.target.files)
    }
  }

  function formatFileSize(bytes: number): string {
    if (!bytes) {
      return '0 Bytes'
    }

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  function removeFile(targetId: string) {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === targetId)

      if (target) {
        URL.revokeObjectURL(target.preview)
      }

      const next = prev.filter((item) => item.id !== targetId)
      notifyParent(next)

      return next
    })
  }

  function clearAll() {
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
    notifyParent([])
  }

  return (
    <div className="w-full p-1">
      <motion.div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        initial={false}
        animate={{
          borderColor: isDragging ? '#3b82f6' : '#dbe3ef',
          scale: isDragging ? 1.01 : 1,
        }}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'relative cursor-pointer rounded-2xl border bg-slate-50/70 p-8 text-center shadow-sm backdrop-blur transition',
          isDragging && 'ring-4 ring-blue-400/30',
        )}
      >
        <div className="flex flex-col items-center gap-5">
          <motion.div
            animate={{ y: isDragging ? [-4, 0, -4] : 0 }}
            transition={{
              duration: 1.2,
              repeat: isDragging ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <UploadCloud
              className={clsx(
                'h-16 w-16 drop-shadow-sm transition-colors duration-300',
                isDragging ? 'text-blue-500' : 'text-slate-500',
              )}
            />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">
              {isDragging
                ? 'Drop file here'
                : files.length > 0
                  ? 'Replace file'
                  : 'Upload your PDF'}
            </h3>
            <p className="mx-auto max-w-md text-slate-600">
              {isDragging ? (
                <span className="font-medium text-blue-500">Release to upload</span>
              ) : (
                <>
                  Drag and drop your project PDF, or{' '}
                  <span className="font-medium text-blue-500">browse</span>
                </>
              )}
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            hidden
            onChange={onSelect}
            accept={accept}
          />
        </div>
      </motion.div>

      <div className="mt-5">
        <AnimatePresence>
          {files.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-center justify-between px-1"
            >
              <h3 className="text-base font-semibold text-slate-800">
                Uploaded file ({files.length})
              </h3>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Clear
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="flex items-start gap-4 rounded-xl bg-white px-4 py-4 shadow-sm"
              >
                <div className="relative shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-16 w-16 rounded-lg border object-cover shadow-sm"
                    />
                  ) : (
                    <FileIcon className="h-16 w-16 text-slate-400" />
                  )}
                  {file.progress >= 100 ? (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-800" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>

                    {file.progress < 100 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        {Math.round(file.progress)}%
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          removeFile(file.id)
                        }}
                        className="rounded-md p-1 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={clsx(
                        'h-full rounded-full',
                        file.progress < 100 ? 'bg-blue-500' : 'bg-emerald-500',
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
