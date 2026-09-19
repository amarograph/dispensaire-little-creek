'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldCabinetArchivesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/redm/cabinet/archives/cloturees'); }, [router]);
  return null;
}
