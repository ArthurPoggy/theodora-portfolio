import React from 'react'

interface Win98WindowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function Win98Window({ title, children, className = '' }: Win98WindowProps) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{
        boxShadow: '2px 2px 0 #dfdfdf inset, -2px -2px 0 #808080 inset',
        border: '2px solid #808080',
        outline: '2px solid #dfdfdf',
      }}
    >
      {/* Barra de título */}
      <div
        className="flex items-center justify-between px-2 py-1 select-none"
        style={{
          background: 'linear-gradient(90deg, #1e0a4a 0%, #7b4fc9 100%)',
          minHeight: '24px',
        }}
      >
        <span
          className="text-white text-xs font-bold truncate"
          style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}
        >
          {title}
        </span>

        {/* Botões decorativos */}
        <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
          {/* Minimizar */}
          <button
            tabIndex={-1}
            aria-hidden="true"
            className="flex items-center justify-center text-black text-xs font-bold leading-none"
            style={{
              width: '16px',
              height: '14px',
              background: '#c0c0c0',
              boxShadow: '1px 1px 0 #dfdfdf inset, -1px -1px 0 #808080 inset',
              border: 'none',
              cursor: 'default',
              fontFamily: 'monospace',
            }}
          >
            ─
          </button>

          {/* Maximizar */}
          <button
            tabIndex={-1}
            aria-hidden="true"
            className="flex items-center justify-center text-black text-xs font-bold leading-none"
            style={{
              width: '16px',
              height: '14px',
              background: '#c0c0c0',
              boxShadow: '1px 1px 0 #dfdfdf inset, -1px -1px 0 #808080 inset',
              border: 'none',
              cursor: 'default',
              fontFamily: 'monospace',
            }}
          >
            □
          </button>

          {/* Fechar */}
          <button
            tabIndex={-1}
            aria-hidden="true"
            className="flex items-center justify-center text-black text-xs font-bold leading-none"
            style={{
              width: '16px',
              height: '14px',
              background: '#c0c0c0',
              boxShadow: '1px 1px 0 #dfdfdf inset, -1px -1px 0 #808080 inset',
              border: 'none',
              cursor: 'default',
              fontFamily: 'monospace',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Área de conteúdo com borda inset */}
      <div
        style={{
          boxShadow: '-1px -1px 0 #dfdfdf inset, 1px 1px 0 #808080 inset',
          padding: '2px',
        }}
      >
        <div
          style={{
            boxShadow: '-1px -1px 0 #ffffff inset, 1px 1px 0 #404040 inset',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
