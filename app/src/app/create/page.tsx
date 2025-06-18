```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, Users, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MarketData {
  title: string
  description: string
  category: string
  endDate: Date | undefined
  resolutionSource: string
  initialLiquidity: string
  outcomes: string[]
}

const categories = [
  'Politics',
  'Sports',
  'Economics',
  'Technology',
  'Entertainment',
  'Weather',
  'Cryptocurrency',
  'Other'
]

export default function CreateMarketPage() {
  const router = useRouter()
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isCreating, setIsCreating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [marketData, setMarketData] = useState<MarketData>({
    title: '',
    description: '',
    category: '',
    endDate: undefined,
    resolutionSource: '',
    initialLiquidity: '',
    outcomes: ['Yes', 'No']
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!marketData.title.trim()) newErrors.title = 'Market title is required'
      if (!marketData.description.trim()) newErrors.description = 'Market description is required'
      if (!marketData.category) newErrors.category = 'Category is required'
    }

    if (step === 2) {
      if (!marketData.endDate) newErrors.endDate = 'End date is required'
      if (marketData.endDate && marketData.endDate <= new Date()) {
        newErrors.endDate = 'End date must be in the future'
      }
      if (!marketData.resolutionSource.trim()) {
        newErrors.resolutionSource = 'Resolution source is required'
      }
    }

    if (step === 3) {
      const liquidity = parseFloat(marketData.initialLiquidity)
      if (!marketData.initialLiquidity || isNaN(liquidity) || liquidity <= 0) {
        newErrors.initialLiquidity = 'Valid initial liquidity is required'
      }
      if (marketData.outcomes.some(outcome => !outcome.trim())) {
        newErrors.outcomes = 'All outcomes must have valid names'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const addOutcome = () => {
    if (marketData.outcomes.length < 10) {
      setMarketData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, '']
      }))
    }
  }

  const removeOutcome = (index: number) => {
    if (marketData.outcomes.length > 2) {
      setMarketData(prev => ({
        ...prev,
        outcomes: prev.outcomes.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOutcome = (index: number, value: string) => {
    setMarketData(prev => ({
      ...prev,
      outcomes: prev.outcomes.map((outcome, i) => i === index ? value : outcome)
    }))
  }

  const createMarket = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    if (!validateStep(3)) return

    setIsCreating(true)

    try {
      // Create market transaction
      const transaction = new Transaction()
      
      // Add market creation instruction (placeholder - replace with actual program instruction)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('11111111111111111111111111111112'),
          lamports: parseFloat(marketData.initialLiquidity) * 1000000000 // Convert SOL to lamports
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Market created successfully!')
      router.push(`/market/${signature}`)
    } catch (error) {
      console.error('Error creating market:', error)
      toast.error('Failed to create market. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-900 font-medium">Market Title</Label>
              <Input
                id="title"
                placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                value={marketData.title}
                onChange={(e) => setMarketData(prev => ({ ...prev, title: e.target.value }))}
                className={cn(
                  "rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600",
                  errors.title && "border-red-500"
                )}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed context and criteria for market resolution..."
                value={marketData.description}
                onChange={(e) => setMarketData(prev => ({ ...prev, description: e.target.value }))}
                className={cn(
                  "rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600 min-h-[120px]",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 font-medium">Category</Label>
              <Select
                value={marketData.category}
                onValueChange={(value) => setMarketData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className={cn(
                  "rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600",
                  errors.category && "border-red-500"
                )}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="rounded-lg">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-900 font-medium">Market End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-slate-200 hover:border-emerald-600",
                      !marketData.endDate && "text-slate-500",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {marketData.endDate ? format(marketData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={marketData.endDate}
                    onSelect={(date) => setMarketData(prev => ({ ...prev, endDate: date }))}
                    disabled={(date) => date <= new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolutionSource" className="text-slate-900 font-medium">Resolution Source</Label>
              <Input
                id="resolutionSource"
                placeholder="e.g., CoinGecko, Reuters, Official announcement"
                value={marketData.resolutionSource}
                onChange={(e) => setMarketData(prev => ({ ...prev, resolutionSource: e.target.value }))}
                className={cn(
                  "rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600",
                  errors.resolutionSource && "border-red-500"
                )}
              />
              {errors.resolutionSource && <p className="text-red-500 text-sm">{errors.resolutionSource}</p>}
              <p className="text-slate-600 text-sm">
                Specify the authoritative source that will be used to resolve this market
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="initialLiquidity" className="text-slate-900 font-medium">Initial Liquidity (SOL)</Label>
              <Input
                id="initialLiquidity"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="1.0"
                value={marketData.initialLiquidity}
                onChange={(e) => setMarketData(prev => ({ ...prev, initialLiquidity: e.target.value }))}
                className={cn(
                  "rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600",
                  errors.initialLiquidity && "border-red-500"
                )}
              />
              {errors.initialLiquidity && <p className="text-red-500 text-sm">{errors.initialLiquidity}</p>}
              <p className="text-slate-600 text-sm">
                This amount will be used to bootstrap market liquidity
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-900 font-medium">Market Outcomes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOutcome}
                  disabled={marketData.outcomes.length >= 10}
                  className="rounded-lg border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  Add Outcome
                </Button>
              </div>
              
              <div className="space-y-3">
                {marketData.outcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Outcome ${index + 1}`}
                      value={outcome}
                      onChange={(e) => updateOutcome(index, e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-emerald-600 focus:ring-emerald-600"
                    />
                    {marketData.outcomes.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOutcome(index)}
                        className="rounded-lg border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.outcomes && <p className="text-red-500 text-sm">{errors.outcomes}</p>}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-semibold text-slate-900">Review Your Market</h3>
              <p className="text-slate-600">
                Please review all details before creating your prediction market
              </p>
            </div>

            <Card className="rounded-xl border-slate-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Title</h4>
                  <p className="text-slate-700">{marketData.title}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-1">Description</h4>
                  <p className="text-slate-700 text-sm">{marketData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Category</h4>
                    <p className="text-slate-700">{marketData.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-