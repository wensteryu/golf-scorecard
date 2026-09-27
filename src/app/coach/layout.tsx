import { RoleLayout } from '@/components/nav/role-layout';

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout role="coach">{children}</RoleLayout>;
}
