import PaymentsOverview from "@/components/payments/PaymentsOverview";

export const metadata = { title: "Payments received – EstateFlow" };

export default function LandlordPaymentsPage() {
  return <PaymentsOverview role="LANDLORD" />;
}
