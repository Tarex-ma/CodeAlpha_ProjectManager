import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '../api/projectsApi';

/**
 * useProjects – fetches the list of projects for the current user.
 * Returns { projects, loading, error, refetch }.
 */
export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjects();
      setProjects(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}
