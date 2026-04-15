
import { auth } from "@/lib/auth";

export default async function Page() {
    const session = await auth();
    return (
        <div>
            <h1>Auth Debug</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}
