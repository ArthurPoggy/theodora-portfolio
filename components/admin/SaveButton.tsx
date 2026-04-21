interface SaveButtonProps {
  onClick: () => void
  saving: boolean
  message?: string
  label?: string
}

export default function SaveButton({ onClick, saving, message, label = 'Salvar' }: SaveButtonProps) {
  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={onClick}
        disabled={saving}
        className="px-6 py-2.5 bg-accent text-bg font-semibold rounded-lg hover:bg-accent-light transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {saving && (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        )}
        {saving ? 'Salvando...' : label}
      </button>
      {message && (
        <span className={`text-sm ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </span>
      )}
      {saving && (
        <span className="text-foreground-muted text-xs">Aguarde ~3 min para o site atualizar</span>
      )}
    </div>
  )
}
