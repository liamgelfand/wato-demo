'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHALLENGE_CATEGORIES, CATEGORY_LABELS } from '@/lib/categories'

interface CategoryFilterProps {
  currentCategory: string
}

export function CategoryFilter({ currentCategory }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    if (!params.has('tab')) {
      params.set('tab', 'challenges')
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <Select value={currentCategory} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]" aria-label="Filter by category">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Categories</SelectItem>
        {CHALLENGE_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
