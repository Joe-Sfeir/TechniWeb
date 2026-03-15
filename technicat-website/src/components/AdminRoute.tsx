import ProtectedRoute from "./ProtectedRoute";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["MASTER", "SUB_MASTER"]}>
      {children}
    </ProtectedRoute>
  );
}
