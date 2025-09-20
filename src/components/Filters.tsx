import FilterControls from "./FilterControls";
import { FilterOptions } from "@/lib/actions/product";

interface FiltersProps {
  filterOptions: FilterOptions;
}

export default function Filters({ filterOptions }: FiltersProps) {
  return (
    <FilterControls
      brands={filterOptions.brands}
      categories={filterOptions.categories}
      genders={filterOptions.genders}
      attributes={filterOptions.attributes}
    />
  );
}
