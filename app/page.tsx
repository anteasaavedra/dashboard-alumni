'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import AlumniDashboardClient from '@/components/AlumniDashboardClient';

// --- Types ---
interface AlumniRaw {
  Nombre: string;
  Mail: string;
  RUT: string;
  Género: string;
  'Fecha de Nacimiento': string;
  Region: string;
  Ciudad: string;
  'Tecnología ': string;
  Curso: string;
  Generacion: string;
  'Nivel Educacional': string;
  Carrera: string;
  Beca: string;
}

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

const normalizeRegion = (region: string): string => {
  if (!region) return 'Sin información';
  const r = region.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (r.includes('metropolitana') || r === 'rm' || r.includes('santiago')) return 'Región Metropolitana de Santiago';
  if (r.includes('valparaiso')) return 'Región de Valparaíso';
  if (r.includes('araucania') || r.includes('ix region')) return 'Región de La Araucanía';
  if (r.includes('biobio') || r.includes('bio bio')) return 'Región del Biobío';
  if (r.includes('los rios')) return 'Región de Los Ríos';
  if (r.includes('los lagos')) return 'Región de Los Lagos';
  if (r.includes('coquimbo')) return 'Región de Coquimbo';
  if (r.includes('maule')) return 'Región del Maule';
  if (r.includes('nuble')) return 'Región del Ñuble';
  if (r.includes('higgins') || r.includes('sexta')) return "Región del Libertador General Bernardo O'Higgins";
  if (r.includes('antofagasta')) return 'Región de Antofagasta';
  if (r.includes('tarapaca')) return 'Región de Tarapacá';
  if (r.includes('arica') || r.includes('parinacota')) return 'Región de Arica y Parinacota';
  if (r.includes('atacama')) return 'Región de Atacama';
  if (r.includes('aysen') || r.includes('aisen')) return 'Región de Aysén del General Carlos Ibáñez del Campo';
  if (r.includes('magallanes') || r.includes('antartica')) return 'Región de Magallanes y de la Antártica Chilena';
  
  if (r.includes('extranjer') || r.includes('fuera') || r.includes('argentina') || r.includes('lima')) return 'Extranjero';

  return 'Sin información';
};

export default function AlumniDashboardPage() {
  const [data, setData] = useState<AlumniProcessed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5d4odVvqKjSE_rgWU1NRiawmRjQHjMb9p6pKLQEcoXeJCqauLthEdcpDvh8hOxEg3ednKe1BjgOrR/pub?output=csv';
        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets');
        
        const csvContent = await response.text();
        const results = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
        });

        const rawData = results.data as AlumniRaw[];
        const uniqueStudents = new Map<string, AlumniRaw[]>();
        
        rawData.forEach(row => {
          const email = (row.Mail || '').trim().toLowerCase();
          const rut = (row.RUT || '').trim().toLowerCase();
          const name = (row.Nombre || '').trim().toLowerCase();
          const key = email || rut || name;
          
          if (key) {
            if (!uniqueStudents.has(key)) uniqueStudents.set(key, []);
            uniqueStudents.get(key)!.push(row);
          }
        });

        const processed = Array.from(uniqueStudents.values()).map((studentRows, index) => {
          const firstRow = studentRows[0];
          const uniqueCursos = Array.from(new Set(studentRows.map(r => r.Curso?.trim()).filter(Boolean)));
          const uniqueTecnologias = Array.from(new Set(studentRows.map(r => r['Tecnología ']?.trim()).filter(Boolean)));
          const cursosCount = uniqueCursos.length;

          return {
            id: `student-${index}`,
            nombre: firstRow.Nombre || 'Sin nombre',
            email: firstRow.Mail || 'Sin email',
            region: normalizeRegion(firstRow.Region),
            cursos: uniqueCursos.length > 0 ? uniqueCursos : ['Sin curso'],
            tecnologias: uniqueTecnologias.length > 0 ? uniqueTecnologias : ['Sin tecnología'],
            beca: firstRow.Beca || 'Sin Beca',
            genero: firstRow.Género || 'Sin información',
            cursosCount: cursosCount,
            multicurso: cursosCount > 1 ? `Sí (${cursosCount})` : 'No'
          };
        });

        setData(processed);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#6b8e82] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-xl font-medium">Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  return <AlumniDashboardClient initialData={data} />;
}
