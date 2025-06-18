```tsx
'use client'

import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, PlusIcon, XIcon, TrendingUpIcon, DollarSignIcon, ClockIcon, UsersIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MarketOutcome {
  id: string
  title: string
  description: string
}

interface CreateMarketFormData {
  title: string
  description: string
  category: string
  resolutionDate: Date | undefined
  outcomes: MarketOutcome[]
  initialLiquidity: string
  creatorFee: string
  tags: string[]
}

const CATEGORIES = [
  'Politics',
  'Sports',
  'Economics',
  'Technology',
  'Entertainment',
  'Weather',
  'Cryptocurrency',
  'Science',
  'Other'
]

export default function CreateMarket() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isCreating, setIsCreating] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  
  const [formData, setFormData] = useState<CreateMarketFormData>({
    title: '',
    description: '',
    category: '',
    resolutionDate: undefined,
    outcomes: [
      { id: '1', title: 'Yes', description: '' },
      { id: '2', title: 'No', description: '' }
    ],
    initialLiquidity: '',
    creatorFee: '2',
    tags: []
  })

  const handleInputChange = (field: keyof CreateMarketFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addOutcome = () => {
    const newOutcome: MarketOutcome = {
      id: Date.now().toString(),
      title: '',
      description: ''
    }
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, newOutcome]
    }))
  }

  const removeOutcome = (id: string) => {
    if (formData.outcomes.length <= 2) {
      toast.error('Market must have at least 2 outcomes')
      return
    }
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(outcome => outcome.id !== id)
    }))
  }

  const updateOutcome = (id: string, field: keyof MarketOutcome, value: string) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.map(outcome =>
        outcome.id === id ? { ...outcome, [field]: value } : outcome
      )
    }))
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Market title is required')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Market description is required')
      return false
    }
    if (!formData.category) {
      toast.error('Please select a category')
      return false
    }
    if (!formData.resolutionDate) {
      toast.error('Resolution date is required')
      return false
    }
    if (formData.resolutionDate <= new Date()) {
      toast.error('Resolution date must be in the future')
      return false
    }
    if (formData.outcomes.some(outcome => !outcome.title.trim())) {
      toast.error('All outcomes must have titles')
      return false
    }
    if (!formData.initialLiquidity || parseFloat(formData.initialLiquidity) <= 0) {
      toast.error('Initial liquidity must be greater than 0')
      return false
    }
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return false
    }
    return true
  }

  const handleCreateMarket = async () => {
    if (!validateForm()) return

    setIsCreating(true)
    try {
      // Create market transaction
      const transaction = new Transaction()
      
      // Add market creation instruction (placeholder - would use actual program)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey('11111111111111111111111111111112'),
          lamports: parseFloat(formData.initialLiquidity) * 1000000000 // Convert SOL to lamports
        })
      )

      const signed = await signTransaction!(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(signature)

      toast.success('Market created successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        resolutionDate: undefined,
        outcomes: [
          { id: '1', title: 'Yes', description: '' },
          { id: '2', title: 'No', description: '' }
        ],
        initialLiquidity: '',
        creatorFee: '2',
        tags: []
      })
    } catch (error) {
      console.error('Error creating market:', error)
      toast.error('Failed to create market')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Prediction Market</h1>
          <p className="text-slate-600">Set up a new market for users to predict real-world events</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="shadow-lg border-0 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
                  Market Details
                </CardTitle>
                <CardDescription>Define the core information for your prediction market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-slate-700 font-medium">Market Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1 rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed context and resolution criteria for your market..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-slate-700 font-medium">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="mt-1 rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-700 font-medium">Resolution Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full mt-1 justify-start text-left font-normal rounded-xl border-slate-200 hover:border-emerald-600",
                            !formData.resolutionDate && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.resolutionDate ? format(formData.resolutionDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.resolutionDate}
                          onSelect={(date) => handleInputChange('resolutionDate', date)}
                          disabled={(date) => date <= new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700 font-medium">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Add tags..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                    />
                    <Button onClick={addTag} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="rounded-lg bg-slate-100 text-slate-700">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                            <XIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outcomes */}
            <Card className="shadow-lg border-0 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <UsersIcon className="h-5 w-5 text-emerald-600" />
                  Market Outcomes
                </CardTitle>
                <CardDescription>Define the possible outcomes users can bet on</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.outcomes.map((outcome, index) => (
                  <div key={outcome.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-slate-700 font-medium">Outcome {index + 1}</Label>
                      {formData.outcomes.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOutcome(outcome.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Input
                        placeholder="Outcome title (e.g., Yes, No, Team A wins)"
                        value={outcome.title}
                        onChange={(e) => updateOutcome(outcome.id, 'title', e.target.value)}
                        className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                      />
                      <Textarea
                        placeholder="Optional description for this outcome..."
                        value={outcome.description}
                        onChange={(e) => updateOutcome(outcome.id, 'description', e.target.value)}
                        className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addOutcome}
                  className="w-full rounded-xl border-dashed border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Another Outcome
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Market Configuration */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <DollarSignIcon className="h-5 w-5 text-emerald-600" />
                  Market Configuration
                </CardTitle>
                <CardDescription>Set up