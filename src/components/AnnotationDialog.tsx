import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, CheckCircle, FileText, Trash2, Edit2 } from 'lucide-react';
import { Annotation, AnnotationType } from '@/services/annotation.service';
import { formatDistanceToNow } from 'date-fns';

interface AnnotationDialogProps {
  open: boolean;
  onClose: () => void;
  stepName: string;
  stepIndex: number;
  annotations: Annotation[];
  onSave: (type: AnnotationType, content: string) => Promise<void>;
  onUpdate: (annotationId: string, type: AnnotationType, content: string) => Promise<void>;
  onDelete: (annotationId: string) => Promise<void>;
}

const annotationTypes: { type: AnnotationType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'insight', label: 'Insight', icon: Lightbulb, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { type: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  { type: 'action', label: 'Action Item', icon: CheckCircle, color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
  { type: 'note', label: 'Note', icon: FileText, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' }
];

const AnnotationDialog: React.FC<AnnotationDialogProps> = ({
  open,
  onClose,
  stepName,
  stepIndex,
  annotations,
  onSave,
  onUpdate,
  onDelete
}) => {
  const [selectedType, setSelectedType] = useState<AnnotationType>('note');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setContent('');
      setEditingId(null);
      setSelectedType('note');
    }
  }, [open]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      if (editingId) {
        await onUpdate(editingId, selectedType, content);
      } else {
        await onSave(selectedType, content);
      }
      setContent('');
      setEditingId(null);
      setSelectedType('note');
    } catch (error) {
      console.error('Error saving annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setSelectedType(annotation.type);
    setContent(annotation.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setContent('');
    setSelectedType('note');
  };

  const handleDelete = async (annotationId: string) => {
    if (!window.confirm('Delete this annotation?')) return;

    setLoading(true);
    try {
      await onDelete(annotationId);
      if (editingId === annotationId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type: AnnotationType) => {
    return annotationTypes.find(t => t.type === type) || annotationTypes[3];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Annotations for "{stepName}"
          </DialogTitle>
          <DialogDescription>
            Add notes, insights, warnings, or action items for this funnel step
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Existing Annotations */}
          {annotations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Existing Annotations</h3>
              {annotations.map((annotation) => {
                const typeConfig = getTypeConfig(annotation.type);
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={annotation.id}
                    className={`p-3 rounded-lg border ${typeConfig.color} ${
                      editingId === annotation.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <Badge variant="secondary" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(annotation)}
                          disabled={loading}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 dark:text-red-400"
                          onClick={() => handleDelete(annotation.id)}
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {annotation.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDistanceToNow(annotation.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add/Edit Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                {editingId ? 'Edit Annotation' : 'Add New Annotation'}
              </label>

              {/* Type Selector */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {annotationTypes.map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === type
                        ? color + ' border-current'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon size={20} className="mx-auto mb-1" />
                    <p className="text-xs font-medium">{label}</p>
                  </button>
                ))}
              </div>

              {/* Content Input */}
              <Textarea
                placeholder="Enter your annotation here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          {editingId && (
            <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
              Cancel Edit
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Annotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnotationDialog;
