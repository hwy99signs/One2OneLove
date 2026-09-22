import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, X } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    searchPlaceholder: "Search memories by title, description, or location...",
    showingFavorites: "Showing Favorites",
    showAll: "Show All",
    clearFilters: "Clear Filters",
    clearSearch: "Clear memory search"
  },
  es: {
    searchPlaceholder: "Buscar recuerdos por título, descripción o ubicación...",
    showingFavorites: "Mostrando Favoritos",
    showAll: "Mostrar Todos",
    clearFilters: "Limpiar Filtros",
    clearSearch: "Borrar búsqueda de recuerdos"
  },
  fr: {
    searchPlaceholder: "Rechercher des souvenirs par titre, description ou lieu...",
    showingFavorites: "Affichage des Favoris",
    showAll: "Tout Afficher",
    clearFilters: "Effacer les Filtres",
    clearSearch: "Effacer la recherche de souvenirs"
  },
  it: {
    searchPlaceholder: "Cerca ricordi per titolo, descrizione o posizione...",
    showingFavorites: "Mostrando Preferiti",
    showAll: "Mostra Tutti",
    clearFilters: "Cancella Filtri",
    clearSearch: "Cancella ricerca dei ricordi"
  },
  de: {
    searchPlaceholder: "Erinnerungen nach Titel, Beschreibung oder Ort suchen...",
    showingFavorites: "Favoriten Anzeigen",
    showAll: "Alle Anzeigen",
    clearFilters: "Filter Löschen",
    clearSearch: "Erinnerungssuche löschen"
  },
  nl: {
    searchPlaceholder: "Zoek herinneringen op titel, beschrijving of locatie...",
    showingFavorites: "Favorieten Tonen",
    showAll: "Alles Tonen",
    clearFilters: "Filters Wissen"
  },
  pt: {
    searchPlaceholder: "Pesquisar memórias por título, descrição ou localização...",
    showingFavorites: "Mostrando Favoritos",
    showAll: "Mostrar Todos",
    clearFilters: "Limpar Filtros"
  }
};

export default function MemoryFilters({ filters, setFilters }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={t.searchPlaceholder}
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="pl-10"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters({ ...filters, searchQuery: '' })}
              aria-label={t.clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Favorite Filter */}
        <Button
          variant={filters.isFavorite ? 'default' : 'outline'}
          onClick={() => setFilters({ ...filters, isFavorite: !filters.isFavorite })}
          className={filters.isFavorite 
            ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
            : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
        >
          <Heart className={`w-4 h-4 mr-2 ${filters.isFavorite ? 'fill-current' : ''}`} />
          {filters.isFavorite ? t.showingFavorites : t.showAll}
        </Button>

        {/* Clear Filters */}
        {(filters.searchQuery || filters.isFavorite) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ searchQuery: '', isFavorite: false })}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            {t.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}