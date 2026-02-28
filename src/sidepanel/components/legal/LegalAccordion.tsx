import { TermsOfUse } from './TermsOfUse.tsx';
import { FAQ } from './FAQ.tsx';
import { DMCANotice } from './DMCANotice.tsx';
import { PrivacyNotice } from './PrivacyNotice.tsx';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="border rounded mb-1">
      <summary className="cursor-pointer px-3 py-2 font-medium text-sm select-none">{title}</summary>
      <div className="px-3 py-2 text-xs text-gray-600 border-t">{children}</div>
    </details>
  );
}

export function LegalAccordion() {
  return (
    <div className="mt-4">
      <Section title="Terms of Use"><TermsOfUse /></Section>
      <Section title="FAQ"><FAQ /></Section>
      <Section title="DMCA Notice"><DMCANotice /></Section>
      <Section title="Privacy Notice"><PrivacyNotice /></Section>
    </div>
  );
}
