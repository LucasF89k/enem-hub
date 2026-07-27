import { Suspense } from "react"
import { MentorChat } from "./mentor-chat"

export const metadata = { title: "Mentor ENEM — Vion" }

export default function MentorPage() {
  return (
    <Suspense>
      <MentorChat />
    </Suspense>
  )
}
