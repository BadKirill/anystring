interface TextFieldProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onSubmit?: () => void
  'aria-label'?: string
}

export function TextField({
  value,
  placeholder,
  onChange,
  onSubmit,
  'aria-label': ariaLabel,
}: TextFieldProps) {
  return (
    <div className="input-field">
      <input
        type="text"
        className="input-field-control"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSubmit?.()
          }
        }}
      />
      {value.length > 0 && (
        <button
          type="button"
          className="input-field-clear"
          aria-label="Clear"
          onClick={() => {
            onChange('')
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
