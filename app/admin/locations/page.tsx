'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { MapPin, Plus, Edit, Trash2, Navigation, Save } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Location {
  id: number;
  name: string;
  address: string;
  lat: string;
  lng: string;
}

const initialLocations: Location[] = [
  { id: 1, name: 'สำนักงานใหญ่ (กรุงเทพ)', address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', lat: '13.7367', lng: '100.5231' },
  { id: 2, name: 'สาขาเชียงใหม่', address: '456 ถนนนิมมานเหมินท์ ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200', lat: '18.7961', lng: '98.9656' },
];

export default function LocationsPage() {
  const [locations, setLocations] = React.useState<Location[]>(initialLocations);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLocation = {
      id: editingLocation ? editingLocation.id : Math.max(0, ...locations.map(l => l.id)) + 1,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      lat: formData.get('lat') as string,
      lng: formData.get('lng') as string,
    };

    if (editingLocation) {
      setLocations(prev => prev.map(l => l.id === editingLocation.id ? newLocation : l));
      showToast('แก้ไขข้อมูลสถานที่สำเร็จ');
    } else {
      setLocations(prev => [...prev, newLocation]);
      showToast('เพิ่มสถานที่ใหม่สำเร็จ');
    }
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่นี้?')) {
      setLocations(prev => prev.filter(l => l.id !== id));
      showToast('ลบสถานที่สำเร็จ');
    }
  };

  const openInGoogleMaps = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลสถานที่ตั้ง</h1>
          <p className="text-slate-500 text-sm">จัดการข้อมูลที่ตั้งสำนักงานและพิกัดแผนที่</p>
        </div>
        <button 
          onClick={() => {
            setEditingLocation(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสถานที่ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {locations.map((loc, index) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6"
          >
            <div className="w-full md:w-64 h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 relative overflow-hidden">
               <Image 
                src={`https://picsum.photos/id/${loc.id + 50}/400/300`} 
                className="w-full h-full object-cover opacity-50" 
                alt="" 
                width={400}
                height={300}
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-emerald-500" />
               </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{loc.name}</h3>
                <p className="text-sm text-slate-500 mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
                  {loc.address}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-600">
                  Lat: {loc.lat}
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-600">
                  Lng: {loc.lng}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  onClick={() => openInGoogleMaps(loc.lat, loc.lng)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  เปิดใน Google Maps
                </button>
                <button 
                  onClick={() => {
                    setEditingLocation(loc);
                    setIsModalOpen(true);
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(loc.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {locations.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            ยังไม่มีข้อมูลสถานที่ในระบบ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อสถานที่</label>
            <input
              name="name"
              defaultValue={editingLocation?.name}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ที่อยู่</label>
            <textarea
              name="address"
              defaultValue={editingLocation?.address}
              required
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Latitude</label>
              <input
                name="lat"
                defaultValue={editingLocation?.lat}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Longitude</label>
              <input
                name="lng"
                defaultValue={editingLocation?.lng}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {editingLocation ? 'บันทึกการแก้ไข' : 'เพิ่มสถานที่'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
