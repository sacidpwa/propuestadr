import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, ClipboardPaste, X, CheckCircle, Loader2, Zap } from "lucide-react";
import { format } from "date-fns";

interface HealthUnit { id: string; name: string; }

const CATEGORIES = [
  "Nomina / Personal", "Medicamentos", "Alimentos", "Servicios",
  "Mantenimiento", "Limpieza", "Transporte", "Seguros", "Impuestos",
  "Papeleria / Office", "Equipo / Mobiliario", "Otro"
];

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  units: HealthUnit[];
}

export default function CapturaRapida({ open, onOpenChange, units }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consecutiveNumber, setConsecutiveNumber] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    health_unit_id: "",
    description: "",
    amount: "",
    category: "",
    notes: "",
    operation_date: format(new Date(), "yyyy-MM-dd"),
    mes_pago: String(new Date().getMonth() + 1),
    anio_pago: String(new Date().getFullYear()),
  });

  const resetForm = () => {
    setForm({
      health_unit_id: "",
      description: "",
      amount: "",
      category: "",
      notes: "",
      operation_date: format(new Date(), "yyyy-MM-dd"),
      mes_pago: String(new Date().getMonth() + 1),
      anio_pago: String(new Date().getFullYear()),
    });
    setImagePreview(null);
    setImageFile(null);
    setConsecutiveNumber("");
    setSuccess(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  // Load next consecutive number when health unit changes
  useEffect(() => {
    if (!form.health_unit_id) { setConsecutiveNumber(""); return; }
    (async () => {
      const { data } = await (supabase.from as any)("expense_entries")
        .select("consecutive_number")
        .eq("health_unit_id", form.health_unit_id)
        .not("consecutive_number", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      const last = (data as any[])?.[0]?.consecutive_number;
      const lastNum = last ? parseInt(last.replace("A", ""), 10) || 0 : 0;
      setConsecutiveNumber(`A${lastNum + 1}`);
    })();
  }, [form.health_unit_id]);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          setImageFile(blob);
          const reader = new FileReader();
          reader.onload = (ev) => setImagePreview(ev.target?.result as string);
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [open, handlePaste]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (error) return null;
    return path;
  };

  const handleSave = async () => {
    if (!form.health_unit_id || !form.description || !form.amount || !user) return;
    setSaving(true);
    try {
      let receiptUrl = null;
      if (imageFile) {
        receiptUrl = await uploadReceipt(imageFile);
      }

      const d = new Date(form.operation_date + "T00:00:00");

      const { error } = await (supabase.from as any)("expense_entries").insert({
        health_unit_id: form.health_unit_id,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category || null,
        notes: form.notes || null,
        operation_date: form.operation_date,
        expense_date: form.operation_date,
        period_year: d.getFullYear(),
        period_month: d.getMonth() + 1,
        entry_type: "gasto",
        receipt_url: receiptUrl,
        consecutive_number: consecutiveNumber,
        created_by: user.id,
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => { resetForm(); onOpenChange(false); }, 1500);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Captura rápida de gasto
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold">Gasto registrado</p>
            <p className="text-sm text-muted-foreground">Número: {consecutiveNumber}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Consecutive number badge */}
            {consecutiveNumber && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30 text-sm px-3 py-1">
                  Folio: {consecutiveNumber}
                </Badge>
              </div>
            )}

            {/* Health unit */}
            <div>
              <Label>Unidad de salud *</Label>
              <Select value={form.health_unit_id} onValueChange={v => setForm({ ...form, health_unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar unidad..." /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date and amount row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={form.operation_date} onChange={e => {
                  const v = e.target.value;
                  const d = new Date(v + "T00:00:00");
                  setForm({ ...form, operation_date: v, mes_pago: String(d.getMonth() + 1), anio_pago: String(d.getFullYear()) });
                }} />
              </div>
              <div>
                <Label>Monto *</Label>
                <Input type="number" min="0" step="0.01" placeholder="$0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Descripción *</Label>
              <Input placeholder="Concepto del gasto..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Category */}
            <div>
              <Label>Categoría</Label>
              <Input list="cap-categorias" placeholder="Seleccionar..." value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <datalist id="cap-categorias">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mes a pagar</Label>
                <Select value={form.mes_pago} onValueChange={v => setForm({ ...form, mes_pago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_ES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Select value={form.anio_pago} onValueChange={v => setForm({ ...form, anio_pago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image capture zone */}
            <div>
              <Label>Comprobante (opcional)</Label>
              <Card className={`border-2 border-dashed ${imagePreview ? "border-green-500/50 bg-green-500/5" : "border-muted-foreground/25"} mt-1`}>
                <CardContent className="p-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Comprobante" className="w-full max-h-48 object-contain rounded" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-xs text-muted-foreground text-center">
                        Captura o pega una imagen del comprobante
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => cameraInputRef.current?.click()}>
                          <Camera className="w-4 h-4 mr-1" /> Cámara
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-1" /> Subir
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => {
                          navigator.clipboard.read?.().then(items => {
                            for (const item of items) {
                              for (const type of item.types) {
                                if (type.startsWith("image/")) {
                                  item.getType(type).then(blob => {
                                    setImageFile(blob);
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                                    reader.readAsDataURL(blob);
                                  });
                                }
                              }
                            }
                          }).catch(() => {});
                        }}>
                          <ClipboardPaste className="w-4 h-4 mr-1" /> Pegar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">o presiona Ctrl+V</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
            </div>

            {/* Notes */}
            <div>
              <Label>Notas</Label>
              <Textarea rows={2} placeholder="Observaciones..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {/* Save button */}
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !form.health_unit_id || !form.description || !form.amount}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {saving ? "Guardando..." : "Registrar gasto"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
