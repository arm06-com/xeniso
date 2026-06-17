"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { tools } from "@/data/tools";

export default function ToolSearch() {
  const [query, setQuery] =
    useState("");

  const filteredTools = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    return tools.filter((tool) =>
      tool.name
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="relative w-full max-w-xl">

      <div className="relative">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          className="w-full border rounded-xl pl-11 pr-4 py-3 text-gray-600"
        />

      </div>

      {filteredTools.length > 0 && (
        <div className="absolute z-50 mt-2 w-full text-gray-500 bg-white border rounded-xl shadow-lg overflow-hidden">

          {filteredTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              onClick={() =>
                setQuery("")
              }
              className="block px-4 py-3 hover:bg-gray-50"
            >
              <div className="font-medium">
                {tool.name}
              </div>

            </Link>
          ))}

        </div>
      )}

    </div>
  );
}