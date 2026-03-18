import Link from "next/link";

export default function home() {
  return(
    <>
    <div className="bg-amber-100 min-h-screen">
      <div>
        <Link href="/login">
        <button className="bg-red-200 p-1 border rounded-sm m-1">Login</button>
        </Link>
      </div>
      <Link href="/create-exam">
      <button className="bg-red-200 p-1 border rounded-sm m-1">Conduct an Exam</button>
      </Link>
    </div>
    </>
  )
}