import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Printer, Shield } from 'lucide-react';
import { Listing } from '../../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logo } from '../../ui/Logo';

interface AgreementModalProps {
  isOpen: boolean;
  listing: Listing | null;
  onClose: () => void;
  renterName?: string;
}

export function AgreementModal({ isOpen, listing, onClose, renterName = "Verified Renter" }: AgreementModalProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen || !listing) return null;

  const agreementId = `RN-${Math.floor(10000 + Math.random() * 90000)}`;

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Agreement-${agreementId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-dark-border w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Lease Agreement</h2>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{agreementId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button onClick={onClose} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-50 dark:bg-slate-950 no-scrollbar">
              <div 
                ref={documentRef}
                className="bg-white dark:bg-white text-slate-900 p-8 md:p-16 shadow-sm mx-auto w-full max-w-[800px] border border-slate-100 min-h-[1000px] flex flex-col"
                id="agreement-document"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-16">
                  <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10" />
                    <div className="flex flex-col">
                      <span className="text-2xl font-black tracking-tighter leading-none">RENTORA.</span>
                      <span className="text-[8px] font-black uppercase text-blue-600 tracking-[0.2em]">Agreement System</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-1">Agreement ID</span>
                    <span className="text-xl font-black tabular-nums">{agreementId}</span>
                  </div>
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-12 border-b-4 border-slate-900 pb-4">RENTAL LEASE AGREEMENT</h1>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-4">Lessor / Owner</h3>
                    <div className="space-y-1">
                      <p className="text-lg font-black">{listing.ownerName}</p>
                      <p className="text-sm text-slate-500 font-medium">Verified Property Owner</p>
                      <p className="text-sm text-slate-500 font-medium">{listing.city}, {listing.country}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-4">Lessee / Renter</h3>
                    <div className="space-y-1">
                      <p className="text-lg font-black">{renterName}</p>
                      <p className="text-sm text-slate-500 font-medium">Verified Platform Renter</p>
                      <p className="text-sm text-slate-500 font-medium">Digital Identity Confirmed</p>
                    </div>
                  </div>
                </div>

                {/* Listing Info */}
                <div className="bg-slate-50 p-8 rounded-3xl mb-12">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Rental Listing Details</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-1">Item Title</p>
                      <p className="font-bold text-lg">{listing.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-1">Category</p>
                      <p className="font-bold">{listing.category.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-1">Location</p>
                      <p className="font-bold">{listing.city}, {listing.country}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-1">Rental Price</p>
                      <p className="text-xl font-black text-blue-600">{listing.currency} {listing.price.toLocaleString()} / {listing.period}</p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="mb-12 flex-1">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] mb-6">Terms and Conditions</h3>
                  <div className="space-y-4 text-sm font-medium leading-relaxed text-slate-600">
                    <p>1. <strong>USAGE:</strong> The Lessee agrees to use the rental item/property solely for its intended purpose and in a lawful manner.</p>
                    <p>2. <strong>DAMAGE:</strong> Any significant damage or loss beyond reasonable wear and tear remains the liability of the Lessee.</p>
                    <p>3. <strong>PAYMENT:</strong> All financial transactions must be processed via the platform to remain valid under this agreement.</p>
                    <p>4. <strong>VALIDITY:</strong> This is a digitally generated document intended for record-keeping and insurance purposes.</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-24 pt-12 border-t-2 border-slate-100">
                  <div className="space-y-4">
                    <div className="h-1 bg-slate-900 w-full" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1">Digital Signature (Owner)</p>
                      <p className="font-syne font-bold italic text-slate-400">Electronically Verified</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-1 bg-slate-900 w-full" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1">Digital Signature (Renter)</p>
                      <p className="font-syne font-bold italic text-slate-400">Electronically Verified</p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex items-center gap-2 text-slate-300">
                  <Shield size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protected by Rentora Trust Engine</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3 transition-colors">
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Close Preview
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Printer size={16} />
                Generate & Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
