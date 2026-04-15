import { useQuery } from "@tanstack/react-query";
import { listFloorPlanLayouts, listFlatTypeRooms } from "@/api/checklists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { FloorPlanView } from "@/components/common/FloorPlanView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

const FLAT_TYPES = ["1BHK", "2BHK", "3BHK"];

export default function FloorPlansPage() {
  const { data: layouts, isLoading: loadingLayouts } = useQuery({
    queryKey: ["floorPlanLayouts"],
    queryFn: () => listFloorPlanLayouts(),
  });

  const { data: rooms } = useQuery({
    queryKey: ["flatTypeRooms"],
    queryFn: () => listFlatTypeRooms(),
  });

  const layoutsByType = useMemo(() => {
    const map = new Map<string, typeof layouts>();
    if (!layouts) return map;
    for (const type of FLAT_TYPES) {
      map.set(type, layouts.filter((l) => l.flat_type === type));
    }
    return map;
  }, [layouts]);

  const roomsByType = useMemo(() => {
    const map = new Map<string, typeof rooms>();
    if (!rooms) return map;
    for (const type of FLAT_TYPES) {
      map.set(type, rooms.filter((r) => r.flat_type === type));
    }
    return map;
  }, [rooms]);

  if (loadingLayouts) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Floor Plans</h1>
        <p className="text-sm text-gray-500">
          Floor plan templates by flat type
        </p>
      </div>

      <Tabs defaultValue="3BHK">
        <TabsList>
          {FLAT_TYPES.map((type) => {
            const typeLayouts = layoutsByType.get(type) ?? [];
            return (
              <TabsTrigger key={type} value={type}>
                {type}
                <span className="ml-1.5 text-xs text-gray-400">
                  ({typeLayouts.length} rooms)
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {FLAT_TYPES.map((type) => {
          const typeLayouts = layoutsByType.get(type) ?? [];
          const typeRooms = roomsByType.get(type) ?? [];

          return (
            <TabsContent key={type} value={type}>
              {typeLayouts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No floor plan layout defined for {type}.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Floor plan preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Layout Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FloorPlanView layouts={typeLayouts} />
                    </CardContent>
                  </Card>

                  {/* Room list */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Rooms ({typeRooms.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {typeRooms.map((room) => (
                          <div
                            key={room.id}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm font-medium">
                              {room.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {room.room_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
