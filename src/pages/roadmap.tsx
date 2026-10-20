import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route, CheckCircle2, Clock, Lock, Play, BookOpen, ExternalLink,
  ChevronRight, Sparkles, Filter, Award, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DEMO_ROADMAP } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
import type { RoadmapNode } from '@/types';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'apticore_learning_roadmap';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [nodes, setNodes] = useState<RoadmapNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEMO_ROADMAP;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode>(nodes[2] || nodes[0]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [nodes]);

  const categories = ['all', 'Fundamentals', 'Frontend', 'Backend', 'Architecture', 'Quality'];

  const filteredNodes = selectedCategory === 'all'
    ? nodes
    : nodes.filter((n) => n.category.toLowerCase() === selectedCategory.toLowerCase());

  const completedCount = nodes.filter((n) => n.status === 'completed').length;
  const progressPercent = Math.round((completedCount / nodes.length) * 100);
  const totalHours = nodes.reduce((acc, curr) => acc + curr.estimatedHours, 0);

  const toggleNodeStatus = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const nextStatus =
            n.status === 'completed'
              ? 'in-progress'
              : n.status === 'in-progress'
              ? 'completed'
              : n.status === 'available'
              ? 'in-progress'
              : 'locked';

          toast.success(`Updated status for "${n.title}" to ${nextStatus}`);
          const updated = { ...n, status: nextStatus as RoadmapNode['status'] };
          if (selectedNode.id === nodeId) setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const getStatusIcon = (status: RoadmapNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} className="text-success-600" />;
      case 'in-progress':
        return <Play size={16} className="text-accent-600 fill-accent-600" />;
      case 'available':
        return <BookOpen size={16} className="text-[#64748B]" />;
      case 'locked':
        return <Lock size={16} className="text-[#94A3B8]" />;
    }
  };

  const getStatusBadge = (status: RoadmapNode['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="accent" size="sm">In Progress</Badge>;
      case 'available':
        return <Badge variant="neutral" size="sm">Available</Badge>;
      case 'locked':
        return <Badge variant="neutral" size="sm">Locked</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Personalized Syllabus
            </span>
            <span className="text-xs text-[#64748B]">Updated for 2026 Hiring Standards</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2 mt-1">
            <Route className="text-accent-600" size={26} />
            {t('roadmap.title', 'Learning & Prep Roadmap')}
          </h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            {t('roadmap.subtitle', 'Step-by-step milestone curriculum from fundamental computer science concepts to corporate placement success.')}
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Sparkles size={16} />}
          onClick={() => navigate('/interview/setup')}
          className="bg-accent-600 hover:bg-accent-700 text-white text-xs"
        >
          Mock Interview for Active Node
        </Button>
      </div>

      {/* Progress Metric Card */}
      <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172033]">
                  Curriculum Mastery: {progressPercent}%
                </h3>
                <p className="text-xs text-[#64748B]">
                  {completedCount} of {nodes.length} core learning milestones completed • ~{totalHours} total hours of structured preparation
                </p>
              </div>
              <span className="text-sm font-bold text-accent-600">
                {completedCount}/{nodes.length} Milestones
              </span>
            </div>
            <ProgressBar value={progressPercent} variant="accent" size="md" />
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center w-full shadow-xs">
              <Award className="mx-auto text-warning-600 mb-1" size={24} />
              <p className="text-xs font-bold text-[#172033]">Next Milestone</p>
              <p className="text-[10px] text-[#64748B]">Fullstack Ready Certification</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[#64748B] font-medium mr-1 flex items-center gap-1">
          <Filter size={14} /> Filter Track:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-accent-600 text-white shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]'
            }`}
          >
            {cat === 'all' ? 'All Modules' : cat}
          </button>
        ))}
      </div>

      {/* Main Roadmap Split: Timeline List & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Milestone Node Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredNodes.map((node) => {
            const isSelected = selectedNode.id === node.id;

            return (
              <Card
                key={node.id}
                padding="md"
                onClick={() => setSelectedNode(node)}
                className={`cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-accent-600 ring-2 ring-accent-600/20 bg-accent-600/5'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                } shadow-xs`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Step Icon */}
                    <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 mt-0.5">
                      {getStatusIcon(node.status)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#172033]">
                          {node.title}
                        </h4>
                        {getStatusBadge(node.status)}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                        {node.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {node.estimatedHours} hrs
                        </span>
                        <span>•</span>
                        <span>{node.category}</span>
                        <span>•</span>
                        <span>{node.resources.length} curated resources</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-[#64748B] shrink-0 self-center" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Active Node Details & Resources (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            <Card padding="lg" className="space-y-5 bg-white border-[#E2E8F0] shadow-xs">
              {/* Node Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="accent" size="sm">{selectedNode.category}</Badge>
                  {getStatusBadge(selectedNode.status)}
                </div>
                <h3 className="text-lg font-bold text-[#172033]">
                  {selectedNode.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {selectedNode.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-[#64748B] font-medium">
                  <Clock size={14} className="text-accent-600" />
                  <span>Estimated commitment: {selectedNode.estimatedHours} hours</span>
                </div>
              </div>

              {/* Status Toggle Action */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                <Button
                  size="sm"
                  className={`w-full ${
                    selectedNode.status === 'completed'
                      ? 'bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]'
                      : 'bg-accent-600 hover:bg-accent-700 text-white'
                  }`}
                  variant={selectedNode.status === 'completed' ? 'outline' : 'primary'}
                  leftIcon={selectedNode.status === 'completed' ? <Check size={16} /> : <Play size={16} />}
                  onClick={() => toggleNodeStatus(selectedNode.id)}
                >
                  {selectedNode.status === 'completed'
                    ? 'Mark In Progress'
                    : selectedNode.status === 'in-progress'
                    ? 'Mark as Completed'
                    : 'Start Milestone'}
                </Button>
              </div>

              {/* Curated Resources */}
              <div className="pt-3 border-t border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2.5">
                  Curated Study Resources
                </h4>
                <div className="space-y-2">
                  {selectedNode.resources.map((res, rIdx) => (
                    <a
                      key={rIdx}
                      href={res.url}
                      onClick={(e) => {
                        e.preventDefault();
                        toast.success(`Opening resource: ${res.title}`);
                      }}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] hover:border-accent-600 bg-[#F8FAFC] flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-accent-600 shrink-0" />
                        <span className="font-medium text-[#172033] group-hover:text-accent-600 line-clamp-1">
                          {res.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#64748B] uppercase font-semibold shrink-0">
                        <span>{res.type}</span>
                        <ExternalLink size={12} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Targeted Interview CTA */}
              <div className="p-3.5 rounded-xl bg-accent-600/5 border border-accent-600/20 text-xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles size={16} className="text-accent-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#172033]">Validate Milestone Readiness</p>
                    <p className="text-[#64748B] text-[11px] mt-0.5">
                      Ready to test your knowledge? Launch an AI interview session tailored to {selectedNode.title}.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2.5 text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                      onClick={() => navigate('/interview/setup')}
                    >
                      Launch Targeted Simulation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
