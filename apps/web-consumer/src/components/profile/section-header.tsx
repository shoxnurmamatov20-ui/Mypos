type Props = {
  children: string;
};

export function SectionHeader({ children }: Props) {
  return (
    <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
      {children}
    </h2>
  );
}
