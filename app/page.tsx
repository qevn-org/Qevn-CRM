import { redirect } from 'next/navigation';

export default function Home() {
  // Rely on middleware for session detection, fallback to login
  redirect('/login');
}
