"use client";

import { ModelType } from "@/lib/mlModels";
import { Button } from "./ui/button";
import { Brain, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ModelSelectorProps {
  selectedModel: ModelType;
  onSelectModel: (model: ModelType) => void;
}

const models = [
  {
    type: "LSTM" as ModelType,
    name: "LSTM",
    description: "Long Short-Term Memory",
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    type: "GRU" as ModelType,
    name: "GRU",
    description: "Gated Recurrent Unit",
    icon: Zap,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    type: "Transformer" as ModelType,
    name: "Transformer",
    description: "Attention Mechanism",
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export default function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {models.map((model) => {
        const Icon = model.icon;
        const isSelected = selectedModel === model.type;
        
        return (
          <motion.div key={model.type} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => onSelectModel(model.type)}
              variant={isSelected ? "default" : "outline"}
              className={`relative overflow-hidden h-auto py-4 px-6 flex flex-col items-center gap-2 transition-all duration-300 ${
                isSelected
                  ? `${model.bgColor} border-2 shadow-lg`
                  : "hover:bg-accent"
              }`}
            >
              <Icon className={`h-6 w-6 ${isSelected ? model.color : "text-muted-foreground"}`} />
              <div className="text-center">
                <div className="font-bold text-sm">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.description}</div>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selectedModel"
                  className="absolute inset-0 border-2 border-primary rounded-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}