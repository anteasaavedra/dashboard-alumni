'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, MapPin, UserCircle, FileText, Search, ExternalLink, Award, BookOpen, Mail, Copy } from 'lucide-react';

// --- Types ---
interface AlumniProcessed {
  id: string;
  nombre: string;
  email: string;
  region: string;
  cursos: string[];
  tecnologias: string[];
  beca: string;
  genero: string;
  multicurso: string;
  cursosCount: number;
}

interface Props {
  initialData: AlumniProcessed[];
}

export default function AlumniDashboardClient({ initialData }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [technologyFilter, setTechnologyFilter] = useState('');

  // Helper function to remove accents and convert to lowercase
  const normalizeString = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const getNormalizedGender = (rawGender: string) => {
    let g = rawGender.trim().toUpperCase();
    if (g === 'M' || g === 'MASCULINO' || g === 'HOMBRE') return 'Masculino';
    if (g === 'F' || g === 'FEMENINO' || g === 'MUJER') return 'Femenino';
    return 'Sin información';
  };

  const uniqueCourses = useMemo(() => {
    const courses = new Set<string>();
    initialData.forEach(a => a.cursos.forEach(c => courses.add(c)));
    return Array.from(courses).sort();
  }, [initialData]);

  const uniqueTechnologies = useMemo(() => {
    const techs = new Set<string>();
    initialData.forEach(a => a.tecnologias.forEach(t => techs.add(t)));
    return Array.from(techs).sort();
  }, [initialData]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set<string>();
    initialData.forEach(a => regions.add(a.region));
    return Array.from(regions).sort();
  }, [initialData]);

  const normalizedSearch = normalizeString(searchTerm);

  const filteredData = useMemo(() => {
    return initialData.filter(alumni => {
      const matchesSearch = !normalizedSearch || 
        normalizeString(alumni.nombre).includes(normalizedSearch) ||
        alumni.cursos.some(c => normalizeString(c).includes(normalizedSearch)) ||
        normalizeString(alumni.region).includes(normalizedSearch) ||
        normalizeString(alumni.email).includes(normalizedSearch);
        
      const matchesGender = !genderFilter || getNormalizedGender(alumni.genero) === genderFilter;
      const matchesCourse = !courseFilter || alumni.cursos.includes(courseFilter);
      const matchesRegion = !regionFilter || alumni.region === regionFilter;
      const matchesTechnology = !technologyFilter || alumni.tecnologias.includes(technologyFilter);
      
      return matchesSearch && matchesGender && matchesCourse && matchesRegion && matchesTechnology;
    });
  }, [initialData, normalizedSearch, genderFilter, courseFilter, regionFilter, technologyFilter]);

  // --- Email Actions ---
  const handleCopyEmails = () => {
    const emails = filteredData.map(a => a.email).filter(e => e && e !== 'Sin email').join(', ');
    navigator.clipboard.writeText(emails);
    alert(`¡${filteredData.length} correos copiados al portapapeles!`);
  };

  const handleSendEmail = () => {
    const emails = filteredData.map(a => a.email).filter(e => e && e !== 'Sin email').join(',');
    window.open(`mailto:?bcc=${emails}`, '_blank');
  };

  // --- Dynamic Calculations ---
  const stats = useMemo(() => {
    if (initialData.length === 0) return null;

    const totalAlumni = initialData.length;
    
    // Gender Distribution
    const genderCounts: Record<string, number> = {};
    initialData.forEach(d => {
      const g = getNormalizedGender(d.genero);
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    });
    const genderData = Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value,
      color: name === 'Masculino' ? '#06b6d4' : name === 'Femenino' ? '#a855f7' : '#52525b'
    }));

    // Region Distribution
    const regionCounts: Record<string, number> = {};
    initialData.forEach(d => {
      const r = d.region.trim() || 'Sin información';
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });
    const regionData = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Course Distribution
    const courseCounts: Record<string, number> = {};
    initialData.forEach(d => {
      d.cursos.forEach(c => {
        const courseName = c.trim() || 'Sin información';
        courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;
      });
    });
    const courseData = Object.entries(courseCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Scholarship Distribution
    const scholarshipCounts: Record<string, number> = { 'Sin Beca': 0, '50%': 0, '100%': 0 };
    initialData.forEach(d => {
      const b = d.beca.trim();
      if (b.includes('100')) scholarshipCounts['100%']++;
      else if (b.includes('50')) scholarshipCounts['50%']++;
      else scholarshipCounts['Sin Beca']++;
    });
    const scholarshipData = [
      { name: 'Sin Beca / Sin Info', value: scholarshipCounts['Sin Beca'], color: '#9ca3af' },
      { name: 'Beca 50%', value: scholarshipCounts['50%'], color: '#f59e0b' },
      { name: 'Beca 100%', value: scholarshipCounts['100%'], color: '#00D1A0' },
    ];

    // Totals
    const totalBecados = scholarshipCounts['100%'] + scholarshipCounts['50%'];
    const totalMulticurso = initialData.filter(d => d.cursosCount > 1).length;
    
    // Majority Gender
    const majorityGender = genderData.sort((a, b) => b.value - a.value)[0];
    const majorityGenderText = majorityGender ? `${majorityGender.name.substring(0, 5)}. (${Math.round((majorityGender.value / totalAlumni) * 100)}%)` : 'N/A';

    return {
      totalAlumni,
      totalBecados,
      totalMulticurso,
      majorityGenderText,
      genderData,
      regionData,
      courseData,
      scholarshipData
    };
  }, [initialData]);

  return (
    <div className="min-h-screen bg-[#6b8e82] text-white font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Base de Datos Alumni
            </h1>
            <p className="text-white/80 mt-1">
              Gestión y visualización de la comunidad de estudiantes (Datos Reales).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a 
              href="https://docs.google.com/spreadsheets/d/e/2PACX-1vT5d4odVvqKjSE_rgWU1NRiawmRjQHjMb9p6pKLQEcoXeJCqauLthEdcpDvh8hOxEg3ednKe1BjgOrR/pubhtml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#FF4A26] text-white rounded-lg hover:bg-[#E03E1C] transition-colors shadow-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ver en Google Sheets
            </a>
          </div>
        </header>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/60" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#00D1A0] focus:border-[#00D1A0] sm:text-sm shadow-sm transition-all"
              placeholder="Buscar alumno por nombre, correo, curso o región..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select 
              value={genderFilter} 
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-[#00D1A0] focus:border-[#00D1A0] block p-2.5 [&>option]:text-gray-900"
            >
              <option value="">Todos los géneros</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Sin información">Sin información</option>
            </select>

            <select 
              value={courseFilter} 
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-[#00D1A0] focus:border-[#00D1A0] block p-2.5 max-w-xs truncate [&>option]:text-gray-900"
            >
              <option value="">Todos los cursos</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select 
              value={technologyFilter} 
              onChange={(e) => setTechnologyFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-[#00D1A0] focus:border-[#00D1A0] block p-2.5 max-w-xs truncate [&>option]:text-gray-900"
            >
              <option value="">Todas las tecnologías</option>
              {uniqueTechnologies.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select 
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-[#00D1A0] focus:border-[#00D1A0] block p-2.5 max-w-xs truncate [&>option]:text-gray-900"
            >
              <option value="">Todas las regiones</option>
              {uniqueRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex items-center gap-4">
            <div className="p-3 bg-white/20 text-white rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Total Alumnos</p>
              <p className="text-2xl font-bold text-white">{stats?.totalAlumni}</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex items-center gap-4">
            <div className="p-3 bg-[#00D1A0]/20 text-[#00D1A0] rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Alumnos Becados</p>
              <p className="text-2xl font-bold text-white">{stats?.totalBecados}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex items-center gap-4">
            <div className="p-3 bg-[#FF4A26]/20 text-[#FF4A26] rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Registros Multicurso</p>
              <p className="text-2xl font-bold text-white">{stats?.totalMulticurso}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex items-center gap-4">
            <div className="p-3 bg-white/20 text-white rounded-xl">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Mayoría Género</p>
              <p className="text-2xl font-bold text-white">{stats?.majorityGenderText}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Courses Bar Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Distribución por Curso (Top)</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.courseData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                    contentStyle={{ backgroundColor: '#4a6b5d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#ffffff' }}
                  />
                  <Bar dataKey="value" fill="#00D1A0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scholarship Pie Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Distribución de Becas</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.scholarshipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.scholarshipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                    contentStyle={{ backgroundColor: '#4a6b5d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#ffffff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'rgba(255,255,255,0.9)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Region Bar Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Distribución por Región (Top 8)</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.regionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                    contentStyle={{ backgroundColor: '#4a6b5d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#ffffff' }}
                  />
                  <Bar dataKey="value" fill="#FF4A26" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender Pie Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Distribución por Género</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                    contentStyle={{ backgroundColor: '#4a6b5d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#ffffff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'rgba(255,255,255,0.9)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Data Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/20 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Directorio de Alumnos</h3>
              <p className="text-sm text-white/80 mt-1">Explora los registros reales de la base de datos.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono bg-white/20 px-3 py-2 rounded-lg text-white">
                {filteredData.length} resultados
              </span>
              <button 
                onClick={handleCopyEmails}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition-colors"
                title="Copiar correos filtrados"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              <button 
                onClick={handleSendEmail}
                className="inline-flex items-center gap-2 px-3 py-2 bg-[#00D1A0] hover:bg-[#00b389] text-gray-900 font-medium text-sm rounded-lg transition-colors"
                title="Enviar correo (BCC) a filtrados"
              >
                <Mail className="w-4 h-4" />
                Enviar Correo
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-[#4a6b5d] sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Región</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Tecnología</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Curso</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Beca</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Multicurso</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/10">
                {filteredData.length > 0 ? (
                  filteredData.map((alumni) => (
                    <tr key={alumni.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#00D1A0]/20 flex items-center justify-center text-[#00D1A0] font-bold text-xs">
                            {alumni.nombre.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{alumni.nombre}</div>
                            <div className="text-sm text-white/60">{alumni.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {alumni.region}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        <div className="flex flex-wrap gap-1">
                          {alumni.tecnologias.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-[#FF4A26]/20 text-white rounded border border-[#FF4A26]/30 text-xs whitespace-nowrap">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80">
                        <div className="flex flex-wrap gap-1">
                          {alumni.cursos.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs whitespace-nowrap">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alumni.beca.includes('100') ? 'bg-[#00D1A0]/20 text-[#00D1A0] border border-[#00D1A0]/30' : 
                          alumni.beca.includes('50') ? 'bg-[#FF4A26]/20 text-[#FF4A26] border border-[#FF4A26]/30' : 
                          'bg-white/10 text-white/60 border border-white/20'
                        }`}>
                          {alumni.beca}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alumni.cursosCount > 1 ? 'bg-[#00D1A0]/20 text-[#00D1A0] border border-[#00D1A0]/30' : 'bg-white/10 text-white/60 border border-white/20'
                        }`}>
                          {alumni.multicurso}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-white/60">
                      No se encontraron resultados para &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/20 bg-white/5 flex justify-between items-center">
            <span className="text-sm text-white/60">Mostrando {filteredData.length} registros</span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm text-[#00D1A0] font-medium hover:text-white transition-colors"
            >
              Volver arriba ↑
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
