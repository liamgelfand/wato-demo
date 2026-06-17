interface ProofDisplayProps {
  proofUrl: string
  proofType: string | null
  className?: string
}

export function ProofDisplay({ proofUrl, proofType, className = 'w-full rounded-lg' }: ProofDisplayProps) {
  if (proofType?.startsWith('video/')) {
    return <video src={proofUrl} controls className={className} />
  }

  return (
    <img
      src={proofUrl}
      alt="Challenge proof"
      className={className}
    />
  )
}
