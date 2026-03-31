import { requireRetailContext } from '@/lib/retail/auth';
import { saveStorefrontSettingsAction } from '../actions';

type StorefrontSettings = {
  showPrice?: boolean;
  showStock?: boolean;
  showCategory?: boolean;
  showPhone?: boolean;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
  showMap?: boolean;
  customHeadline?: string | null;
  customNotice?: string | null;
};

function parseSettings(raw: string | null): StorefrontSettings {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StorefrontSettings;
  } catch {
    return {};
  }
}

export default async function StorefrontSettingsPage() {
  const { team } = await requireRetailContext();
  const s = parseSettings(team.storefrontSettings);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Storefront customization</h2>
      <form action={saveStorefrontSettingsAction} className="border rounded-md p-4 space-y-3 max-w-2xl">
        {[
          ['showPrice', 'Show price to buyers', s.showPrice ?? true],
          ['showStock', 'Show stock quantity', s.showStock ?? true],
          ['showCategory', 'Show category details', s.showCategory ?? true],
          ['showPhone', 'Show business phone', s.showPhone ?? true],
          ['showWhatsapp', 'Show business WhatsApp', s.showWhatsapp ?? true],
          ['showWebsite', 'Show business website', s.showWebsite ?? true],
          ['showMap', 'Show business map location', s.showMap ?? true]
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={String(name)} value="true" defaultChecked={Boolean(checked)} />
            {String(label)}
          </label>
        ))}
        <input
          name="customHeadline"
          defaultValue={s.customHeadline || ''}
          placeholder="Custom storefront headline"
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
        />
        <textarea
          name="customNotice"
          defaultValue={s.customNotice || ''}
          placeholder="Any custom notice for buyers"
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600">
          Save storefront settings
        </button>
      </form>
    </section>
  );
}
