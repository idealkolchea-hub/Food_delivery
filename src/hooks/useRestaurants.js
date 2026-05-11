import { useEffect, useMemo, useState } from 'react';
import { categories } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { mapRestaurantRecord } from '../lib/catalog';

export function useRestaurants(activeCategory, search) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadRestaurants() {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*, menu_items(*)')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (ignore) return;

      if (fetchError) {
        setError(fetchError.message || 'Failed to load restaurants.');
        setRecords([]);
        setLoading(false);
        return;
      }

      setRecords((data || []).map(mapRestaurantRecord));
      setLoading(false);
    }

    loadRestaurants();

    return () => {
      ignore = true;
    };
  }, []);

  return useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = records.filter((restaurant) => {
      const categoryMatch = activeCategory === 'all' || restaurant.category === activeCategory;
      const searchMatch = !normalized
        || restaurant.name.toLowerCase().includes(normalized)
        || restaurant.cuisine.toLowerCase().includes(normalized)
        || restaurant.tags.some((tag) => tag.toLowerCase().includes(normalized));
      return categoryMatch && searchMatch;
    });

    return { restaurants: filtered, categories, loading, error };
  }, [activeCategory, search, records, loading, error]);
}
