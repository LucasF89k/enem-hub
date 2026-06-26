import { Suspense } from "react"
import { MentorChat } from "./mentor-chat"

export const metadata = { title: "Mentor ENEM — ENEM Hub" }

export default function MentorPage() {
  return (
    <Suspense>
      <MentorChat />
    </Suspense>
  )
}
