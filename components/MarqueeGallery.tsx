import Image from 'next/image'
import Link from 'next/link'

interface MarqueeItem {
  src: string
  alt: string
  href: string
  category: string
}

interface MarqueeGalleryProps {
  items: MarqueeItem[]
  direction?: 'left' | 'right'
}

export default function MarqueeGallery({ items, direction = 'left' }: MarqueeGalleryProps) {
  // Duplicar os itens para criar loop infinito contínuo
  const doubled = [...items, ...items]

  return (
    <div className="marquee-wrapper py-2">
      <div className={`marquee-track ${direction === 'left' ? 'marquee-track-left' : 'marquee-track-right'}`}>
        {doubled.map((item, idx) => (
          <MarqueeCard key={`${item.href}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  )
}

function MarqueeCard({ item }: { item: MarqueeItem }) {
  return (
    <Link href={item.href} className="group relative flex-shrink-0 w-64 h-48 rounded-2xl overflow-hidden bg-bg-card block">
      {/* Imagem */}
      <Image
        src={item.src}
        alt={item.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="256px"
      />
      {/* Overlay no hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
        <span className="text-foreground font-semibold text-sm tracking-wider uppercase">
          {item.category}
        </span>
        <span className="px-3 py-1 border border-accent text-accent text-xs rounded hover:bg-accent hover:text-bg transition-colors">
          Ver galeria →
        </span>
      </div>
    </Link>
  )
}
