"use client";

import { useState } from "react";
import type { EbayComp } from "@/lib/cardTypes";

export function useEbayCheck() {
  const [ebayCheckOpen, setEbayCheckOpen] = useState(false);
  const [ebayCheckQuery, setEbayCheckQuery] = useState("");
  const [ebayCheckGrade, setEbayCheckGrade] = useState("");
  const [ebayCheckResults, setEbayCheckResults] = useState<EbayComp[]>([]);
  const [ebayCheckLoading, setEbayCheckLoading] = useState(false);
  const [ebayCheckError, setEbayCheckError] = useState<string | null>(null);
  const [ebayCheckAvg, setEbayCheckAvg] = useState<number | null>(null);
  const [ebayCheckLow, setEbayCheckLow] = useState<number | null>(null);
  const [ebayCheckHigh, setEbayCheckHigh] = useState<number | null>(null);
  const [ebayCheckTotal, setEbayCheckTotal] = useState(0);
  const [ebayCheckListOpen, setEbayCheckListOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const togglePanel = () => {
    setEbayCheckOpen((prev) => !prev);
    setEbayCheckResults([]);
    setEbayCheckError(null);
    setEbayCheckAvg(null);
    setEbayCheckLow(null);
    setEbayCheckHigh(null);
    setEbayCheckTotal(0);
    setEbayCheckListOpen(false);
  };

  const handleEbayCheck = async () => {
    const q = ebayCheckQuery.trim();
    if (!q) return;
    setEbayCheckLoading(true);
    setEbayCheckError(null);
    setEbayCheckResults([]);
    setEbayCheckAvg(null);
    setEbayCheckLow(null);
    setEbayCheckHigh(null);
    setEbayCheckTotal(0);
    setEbayCheckListOpen(false);

    try {
      const gradeParam = ebayCheckGrade ? `&grade=${ebayCheckGrade}` : "";
      const res = await fetch(`/api/ebay-prices?q=${encodeURIComponent(q)}&limit=20${gradeParam}`);
      if (!res.ok) throw new Error("Failed to fetch eBay prices");
      const data = await res.json();
      const results = data.results || [];
      setEbayCheckResults(results);
      setEbayCheckTotal(data.total || 0);
      if (results.length > 0) {
        const prices = results.map((r: { price: number }) => r.price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          setEbayCheckAvg(Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length));
          setEbayCheckLow(Math.min(...prices));
          setEbayCheckHigh(Math.max(...prices));
        }
      }
      setEbayCheckListOpen(true);
    } catch (err) {
      setEbayCheckError(err instanceof Error ? err.message : "Failed to search eBay");
    } finally {
      setEbayCheckLoading(false);
    }
  };

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setEbayCheckError("Voice input not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      setEbayCheckQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognition.start();
  };

  return {
    ebayCheckOpen, ebayCheckQuery, setEbayCheckQuery, ebayCheckGrade, setEbayCheckGrade,
    ebayCheckResults, ebayCheckLoading, ebayCheckError,
    ebayCheckAvg, ebayCheckLow, ebayCheckHigh, ebayCheckTotal,
    ebayCheckListOpen, isListening,
    togglePanel, handleEbayCheck, startVoiceInput,
  };
}
