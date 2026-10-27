// Ilustraciones vectoriales propias para el catálogo de servicios.
// Los colores salen de variables CSS (.service-art__*), así se adaptan al tema claro y oscuro.

const scenes = {
  requests: (
    <>
      <rect className="service-art__soft" x="96" y="34" width="96" height="112" rx="10" transform="rotate(-8 144 90)" />
      <rect className="service-art__card" x="116" y="24" width="96" height="116" rx="10" />
      <path className="service-art__soft" d="M190 24h12a10 10 0 0 1 10 10v12h-14a8 8 0 0 1-8-8z" />
      <rect className="service-art__ink" x="130" y="44" width="46" height="7" rx="3.5" />
      <rect className="service-art__line" x="130" y="62" width="66" height="5" rx="2.5" />
      <rect className="service-art__line" x="130" y="76" width="58" height="5" rx="2.5" />
      <rect className="service-art__line" x="130" y="90" width="62" height="5" rx="2.5" />
      <rect className="service-art__line" x="130" y="104" width="40" height="5" rx="2.5" />
      <circle className="service-art__ink" cx="210" cy="126" r="21" />
      <path className="service-art__stroke-light" d="m200 126 7 7 13-14" />
    </>
  ),
  reservations: (
    <>
      <rect className="service-art__card" x="92" y="28" width="132" height="112" rx="12" />
      <path className="service-art__ink" d="M92 40a12 12 0 0 1 12-12h108a12 12 0 0 1 12 12v12H92z" />
      <rect className="service-art__ink-dark" x="116" y="20" width="7" height="18" rx="3.5" />
      <rect className="service-art__ink-dark" x="193" y="20" width="7" height="18" rx="3.5" />
      {[0, 1, 2, 3].map((col) => [0, 1, 2].map((row) => (
        <rect key={`${col}-${row}`} className={col === 2 && row === 1 ? 'service-art__ink' : 'service-art__soft'}
          x={106 + col * 28} y={64 + row * 22} width="20" height="14" rx="4" />
      )))}
      <circle className="service-art__card service-art__outline" cx="226" cy="124" r="24" />
      <path className="service-art__stroke" d="M226 110v15l10 6" />
    </>
  ),
  resources: (
    <>
      <rect className="service-art__card" x="76" y="38" width="122" height="80" rx="9" />
      <rect className="service-art__soft" x="86" y="48" width="102" height="60" rx="5" />
      <rect className="service-art__ink" x="98" y="60" width="38" height="6" rx="3" />
      <rect className="service-art__line" x="98" y="74" width="72" height="5" rx="2.5" />
      <rect className="service-art__line" x="98" y="86" width="54" height="5" rx="2.5" />
      <path className="service-art__card" d="M64 122h146l-10 14H74z" />
      <path className="service-art__card service-art__outline" d="M222 52h20v26l22 42a8 8 0 0 1-7 12h-50a8 8 0 0 1-7-12l22-42z" />
      <path className="service-art__ink" d="M214 106h36l7 14a6 6 0 0 1-5 8h-40a6 6 0 0 1-5-8z" />
      <rect className="service-art__ink-dark" x="218" y="46" width="28" height="8" rx="4" />
      <circle className="service-art__card" cx="228" cy="114" r="3.5" />
      <circle className="service-art__card" cx="240" cy="120" r="2.5" />
    </>
  ),
  events: (
    <>
      <path className="service-art__card" d="M84 50a10 10 0 0 1 10-10h132a10 10 0 0 1 10 10v16a14 14 0 0 0 0 28v16a10 10 0 0 1-10 10H94a10 10 0 0 1-10-10V94a14 14 0 0 0 0-28z" />
      <path className="service-art__line-dash" d="M190 46v68" />
      <rect className="service-art__ink" x="102" y="58" width="60" height="8" rx="4" />
      <rect className="service-art__line" x="102" y="76" width="74" height="5" rx="2.5" />
      <rect className="service-art__line" x="102" y="88" width="50" height="5" rx="2.5" />
      <path className="service-art__ink" d="m212 64 4.4 9 9.9 1.4-7.2 7 1.7 9.8-8.8-4.6-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z" />
      <rect className="service-art__ink" x="66" y="28" width="8" height="8" rx="2" transform="rotate(20 70 32)" />
      <rect className="service-art__ink-dark" x="246" y="30" width="7" height="7" rx="2" transform="rotate(-25 249 33)" />
      <circle className="service-art__ink" cx="252" cy="132" r="5" />
      <circle className="service-art__ink-dark" cx="72" cy="134" r="4" />
      <rect className="service-art__soft" x="238" y="112" width="9" height="9" rx="2" transform="rotate(35 242 116)" />
    </>
  ),
  notifications: (
    <>
      <rect className="service-art__card" x="120" y="16" width="80" height="136" rx="14" />
      <rect className="service-art__soft" x="128" y="30" width="64" height="108" rx="6" />
      <path className="service-art__ink" d="M160 52a16 16 0 0 0-16 16c0 16-6 18-6 22h44c0-4-6-6-6-22a16 16 0 0 0-16-16z" />
      <path className="service-art__ink-dark" d="M154 94a6 6 0 0 0 12 0z" />
      <circle className="service-art__alert" cx="174" cy="56" r="7" />
      <rect className="service-art__card service-art__outline" x="62" y="96" width="90" height="34" rx="10" />
      <circle className="service-art__ink" cx="80" cy="113" r="7" />
      <rect className="service-art__line" x="94" y="106" width="46" height="5" rx="2.5" />
      <rect className="service-art__line" x="94" y="116" width="32" height="5" rx="2.5" />
      <rect className="service-art__card service-art__outline" x="176" y="66" width="86" height="34" rx="10" />
      <circle className="service-art__ink" cx="194" cy="83" r="7" />
      <rect className="service-art__line" x="208" y="76" width="42" height="5" rx="2.5" />
      <rect className="service-art__line" x="208" y="86" width="28" height="5" rx="2.5" />
    </>
  ),
  pqrs: (
    <>
      <path className="service-art__card" d="M78 44a12 12 0 0 1 12-12h104a12 12 0 0 1 12 12v50a12 12 0 0 1-12 12h-80l-22 18v-18h-2a12 12 0 0 1-12-12z" />
      <rect className="service-art__ink" x="96" y="50" width="54" height="7" rx="3.5" />
      <rect className="service-art__line" x="96" y="66" width="90" height="5" rx="2.5" />
      <rect className="service-art__line" x="96" y="78" width="70" height="5" rx="2.5" />
      <path className="service-art__ink" d="M150 88a12 12 0 0 1 12-12h80a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12h-2v16l-20-16h-58a12 12 0 0 1-12-12z" />
      <rect className="service-art__ink-light" x="166" y="94" width="62" height="5" rx="2.5" />
      <rect className="service-art__ink-light" x="166" y="106" width="44" height="5" rx="2.5" />
      <circle className="service-art__ink-light" cx="232" cy="120" r="3" />
      <circle className="service-art__ink-light" cx="222" cy="120" r="3" />
      <circle className="service-art__ink-light" cx="242" cy="120" r="3" />
    </>
  ),
  building: (
    <>
      <path className="service-art__ink" d="M160 22 82 58h156z" />
      <rect className="service-art__card" x="88" y="58" width="144" height="10" rx="3" />
      {[0, 1, 2, 3, 4].map((index) => (
        <rect key={index} className="service-art__card" x={100 + index * 26} y="72" width="12" height="54" rx="3" />
      ))}
      <rect className="service-art__card" x="80" y="126" width="160" height="12" rx="3" />
      <circle className="service-art__card" cx="160" cy="44" r="6" />
    </>
  ),
};

export default function ServiceIllustration({ name }) {
  const scene = scenes[name] || scenes.building;
  return (
    <svg className="service-art" viewBox="0 0 320 160" role="presentation" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <circle className="service-art__blob" cx="34" cy="138" r="46" />
      <circle className="service-art__blob" cx="296" cy="20" r="38" />
      {scene}
    </svg>
  );
}
