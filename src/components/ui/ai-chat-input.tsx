import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowUp } from 'lucide-react'

const cn = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(' ')

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white shadow hover:bg-slate-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
        outline: 'border border-slate-200 bg-white shadow-sm hover:bg-slate-50',
        secondary: 'bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200',
        ghost: 'hover:bg-slate-100',
        link: 'text-teal-700 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const ChatButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
ChatButton.displayName = 'ChatButton'

interface PromptInputProps {
  placeholder?: string
  onSubmit?: (value: string) => void
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ placeholder = 'Type your message...', onSubmit, onChange, disabled = false, className }, ref) => {
    const [value, setValue] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    const submit = () => {
      if (!value.trim() || !onSubmit) {
        return
      }

      onSubmit(value.trim())
      setValue('')
    }

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      submit()
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setValue(next)
      onChange?.(next)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        submit()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500',
          className,
        )}
      >
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />

          <ChatButton
            type="submit"
            size="icon"
            disabled={disabled || !value.trim()}
            className="h-7 w-7 shrink-0"
          >
            <ArrowUp size={16} />
            <span className="sr-only">Send message</span>
          </ChatButton>
        </form>
      </div>
    )
  },
)
PromptInput.displayName = 'PromptInput'

function Component() {
  const handleSubmit = (value: string) => {
    console.log('Submitted:', value)
  }

  const handleChange = (value: string) => {
    console.log('Changed:', value)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <PromptInput placeholder="Ask a question..." onSubmit={handleSubmit} onChange={handleChange} />
      </div>
    </div>
  )
}

export { Component, PromptInput }
