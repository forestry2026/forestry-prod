/**
 * Production Team Dashboard
 * Real-time overview of active jobs and KPIs
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JobCard from '@/components/production/JobCard';
import { Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

// Dummy data
const DUMMY_JOBS = [
  {
    id: 'prod-001',
    orderNumber: 'PO-2026-0001',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    currentStage: 'MOLDING',
    estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Al Jazeera Ceramics',
        },
      },
      items: [
        { quantity: 100 },
        { quantity: 150 },
      ],
    },
  },
  {
    id: 'prod-002',
    orderNumber: 'PO-2026-0002',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    currentStage: 'DRYING',
    estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Emirates Pottery Co.',
        },
      },
      items: [
        { quantity: 200 },
      ],
    },
  },
  {
    id: 'prod-003',
    orderNumber: 'PO-2026-0003',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    currentStage: 'FINISHING',
    estimatedCompletion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Dubai Art Studios',
        },
      },
      items: [
        { quantity: 75 },
      ],
    },
  },
  {
    id: 'prod-004',
    orderNumber: 'PO-2026-0004',
    status: 'APPROVED',
    priority: 'NORMAL',
    currentStage: 'PENDING',
    estimatedCompletion: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Al Ain Ceramics',
        },
      },
      items: [
        { quantity: 500 },
      ],
    },
  },
];

export default function ProductionDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState(DUMMY_JOBS);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [filteredJobs, setFilteredJobs] = useState(DUMMY_JOBS);

  useEffect(() => {
    if (selectedStage === 'ALL') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter((j) => j.currentStage === selectedStage));
    }
  }, [selectedStage, jobs]);

  const kpis = {
    activeJobs: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
    completedToday: 0, // Would be calculated from actual data
    overdueJobs: jobs.filter((j) => j.status === 'IN_PROGRESS' && new Date(j.estimatedCompletion) < new Date()).length,
    totalCompleted: 0, // Would be calculated from actual data
  };

  const stages = ['PENDING', 'MOLDING', 'DRYING', 'FINISHING', 'GLAZING', 'QUALITY_CHECK', 'PACKAGING', 'READY'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time overview of active jobs</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{kpis.activeJobs}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{kpis.completedToday}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Jobs</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{kpis.overdueJobs}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Completed</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{kpis.totalCompleted}</p>
              </div>
              <Clock className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Stage Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <p className="font-semibold text-gray-900 mb-4">Filter by Production Stage</p>
          <div className="flex gap-2 flex-wrap">
            {['ALL', ...stages].map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStage === stage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {stage === 'ALL' ? 'All Jobs' : stage.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} href={`/production/jobs/${job.id}`} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No jobs in this stage</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">Quick Links</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push('/production/jobs')}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-300 rounded-lg font-semibold transition-colors"
            >
              View All Jobs
            </button>
            <button
              onClick={() => router.push('/production/completed')}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-300 rounded-lg font-semibold transition-colors"
            >
              Completed Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
