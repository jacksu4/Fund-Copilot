'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FileUploadModal = ({ isOpen, onClose }: FileUploadModalProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [valuationFile, setValuationFile] = useState<File | null>(null);
    const [trsFile, setTrsFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    const [syncResult, setSyncResult] = useState<any>(null);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, []);

    const handleFiles = (files: File[]) => {
        let foundDate = '';
        files.forEach(file => {
            console.log('Processing file:', file.name);
            // Try to extract date: Matches YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD, YYYY_MM_DD
            // We look for the pattern anywhere in the string, which covers the suffix case.
            const dateMatch = file.name.match(/(20\d{2})[-._\s]?(0[1-9]|1[0-2])[-._\s]?(0[1-9]|[12]\d|3[01])/);

            if (dateMatch && !foundDate) {
                // Normalize to YYYYMMDD
                const year = dateMatch[1];
                const month = dateMatch[2];
                const day = dateMatch[3];
                foundDate = `${year}${month}${day}`;
            }

            const lowerName = file.name.toLowerCase();
            if (lowerName.includes('valuation') || lowerName.includes('估值') || lowerName.includes('nav') || lowerName.includes('净值') || lowerName.includes('资产')) {
                setValuationFile(file);
            } else if (lowerName.includes('trs') || lowerName.includes('report') || lowerName.includes('合约') || lowerName.includes('盯市') || lowerName.includes('position') || lowerName.includes('明细')) {
                setTrsFile(file);
            }
        });

        if (foundDate) {
            setSelectedDate(foundDate);
        }
    };

    const handleUpload = async () => {
        if (!valuationFile || !trsFile) {
            setErrorMessage('Please select both Valuation and TRS files.');
            return;
        }
        if (!selectedDate || selectedDate.length !== 8) {
            setErrorMessage('Please enter a valid date (YYYYMMDD)');
            return;
        }

        setUploading(true);
        setUploadStatus('idle');
        setErrorMessage('');

        try {
            // Upload Valuation
            const valPath = `reports/${selectedDate}/valuation.xls`;
            const { error: valError } = await supabase.storage
                .from('reports')
                .upload(valPath, valuationFile, { upsert: true });

            if (valError) throw valError;

            // Upload TRS
            const trsPath = `reports/${selectedDate}/trs.xlsx`;
            const { error: trsError } = await supabase.storage
                .from('reports')
                .upload(trsPath, trsFile, { upsert: true });

            if (trsError) throw trsError;

            // Trigger Sync
            const res = await fetch('/api/sync', { method: 'POST' });
            const result = await res.json();

            if (!result.success) throw new Error(result.error || 'Sync failed');

            setUploadStatus('success');
            setSyncResult(result);

        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            setErrorMessage(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Upload Reports</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {uploadStatus === 'success' && syncResult ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sync Complete!</h3>
                            <div className="bg-slate-50 rounded-lg p-4 text-left text-sm text-slate-600 mb-6 space-y-2 border border-slate-100">
                                <div className="flex justify-between">
                                    <span>Processed:</span>
                                    <span className="font-mono font-bold text-slate-900">{syncResult.results.filter((r: any) => r.status === 'success').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Skipped:</span>
                                    <span className="font-mono font-bold text-slate-900">{syncResult.results.filter((r: any) => r.status === 'skipped').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Errors:</span>
                                    <span className="font-mono font-bold text-rose-600">{syncResult.results.filter((r: any) => r.status === 'error').length}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onClose();
                                    window.location.reload();
                                }}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Date Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Report Date (YYYYMMDD)
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="20241120"
                                    />
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${isDragging
                                    ? 'border-indigo-500 bg-indigo-50/50'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                    <Upload size={24} />
                                </div>
                                <p className="text-sm font-medium text-slate-900">
                                    Drag & drop files here
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    or click to browse
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                                />
                            </div>

                            {/* File List */}
                            <div className="space-y-3">
                                <div className={`flex items-center p-3 rounded-lg border ${valuationFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <FileSpreadsheet size={18} className={valuationFile ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span className={`ml-3 text-sm flex-1 truncate ${valuationFile ? 'text-emerald-900 font-medium' : 'text-slate-400'}`}>
                                        {valuationFile ? valuationFile.name : 'Valuation Report (xls)'}
                                    </span>
                                    {valuationFile && <CheckCircle size={16} className="text-emerald-500" />}
                                </div>

                                <div className={`flex items-center p-3 rounded-lg border ${trsFile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <FileSpreadsheet size={18} className={trsFile ? 'text-emerald-600' : 'text-slate-400'} />
                                    <span className={`ml-3 text-sm flex-1 truncate ${trsFile ? 'text-emerald-900 font-medium' : 'text-slate-400'}`}>
                                        {trsFile ? trsFile.name : 'TRS Report (xlsx)'}
                                    </span>
                                    {trsFile && <CheckCircle size={16} className="text-emerald-500" />}
                                </div>
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="flex items-center text-rose-600 text-xs bg-rose-50 p-3 rounded-lg">
                                    <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                                    {errorMessage}
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !valuationFile || !trsFile}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    'Upload & Sync'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
