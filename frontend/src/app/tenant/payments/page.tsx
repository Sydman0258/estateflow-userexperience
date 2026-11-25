import PaymentsOverview from "@/components/payments/PaymentsOverview";

export const metadata = { title: "Payments – EstateFlow" };

export default function TenantPaymentsPage() {
  return <PaymentsOverview role="TENANT" />;
}
