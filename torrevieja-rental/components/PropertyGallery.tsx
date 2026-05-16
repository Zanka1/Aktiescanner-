import Image from 'next/image';
import { property } from '@/lib/property';

export function PropertyGallery() {
  const [hero, ...rest] = property.images;

  return (
    <div className="grid gap-3 overflow-hidden rounded-3xl lg:grid-cols-2">
      <div className="relative min-h-[320px] lg:min-h-[520px]">
        <Image src={hero.src} alt={hero.alt} fill priority className="object-cover" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rest.map((image) => (
          <div key={image.src} className="relative min-h-[190px] lg:min-h-[254px]">
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
