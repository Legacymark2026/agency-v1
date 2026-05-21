'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Split, RotateCcw } from 'lucide-react';

interface BeforeAfterProps {
  beforeUrl?: string;
  afterUrl?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterComparison({ beforeUrl, afterUrl, beforeLabel = 'Original', afterLabel = 'Editado' }: BeforeAfterProps) {
  const [splitPosition, setSplitPosition] = useState(50);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Split className="w-5 h-5 text-teal-400" />
            Before / After
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSplitPosition(50)}
            className="text-slate-400"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="relative h-64 bg-slate-900 rounded-lg overflow-hidden">
          {/* Before (left) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
          >
            {beforeUrl ? (
              <img src={beforeUrl} alt="Before" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Badge variant="outline" className="border-slate-600 text-slate-400 mb-2">
                  {beforeLabel}
                </Badge>
                <p className="text-slate-500 text-sm">Video original</p>
              </div>
            )}
          </div>

          {/* After (right) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
          >
            {afterUrl ? (
              <img src={afterUrl} alt="After" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Badge variant="outline" className="border-teal-500/30 text-teal-400 mb-2">
                  {afterLabel}
                </Badge>
                <p className="text-slate-500 text-sm">Video editado</p>
              </div>
            )}
          </div>

          {/* Split line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white z-10 cursor-ew-resize"
            style={{ left: `${splitPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Split className="w-4 h-4 text-slate-800" />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Slider
            value={[splitPosition]}
            onValueChange={([v]) => setSplitPosition(v)}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </CardContent>
    </Card>
  );
}
