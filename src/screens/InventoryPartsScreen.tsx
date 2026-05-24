import { Pressable, View } from "react-native";

import { Text } from "../i18n";
import {
  ARCHIVE_FILTER_OPTIONS,
  BLOCKER_FILTER_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_STYLES,
  INVENTORY_VIEW_OPTIONS,
  MANUFACTURING_STATUS_OPTIONS,
  MANUFACTURING_VIEW_OPTIONS,
  MATERIAL_CATEGORY_OPTIONS,
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  STATUS_LABELS,
  SUBVIEW_INTERACTION_GUIDANCE,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_SUBTEAM_OPTIONS,
  TASK_VIEW_OPTIONS,
  WORKLOG_SORT_OPTIONS,
} from "../ui/constants";
import { styles } from "../ui/styles";
import {
  EmptyState,
  FilterToolbar,
  InteractionNote,
  OptionChipRow,
  SearchField,
  StatusPill,
  SummaryRow,
  WorkspacePanel,
} from "../ui/ui";
import { PART_STATUS_OPTIONS } from "../ui/constants";

import type { AppScreenProps } from "./types";

export function InventoryPartsScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    editTagStyle,
    filteredPartDefinitions,
    filteredPartInstances,
    openCreatePartDefinitionEditor,
    openEditPartDefinitionEditor,
    partDefinitions,
    partDefinitionsById,
    partInstancesWithStatus,
    partsSearch,
    partsStatusFilter,
    partsSubsystemFilter,
    mechanismsById,
    subsystems,
    subsystemsById,
    setPartsSearch,
    setPartsStatusFilter,
    setPartsSubsystemFilter,
  } = props;

const renderScreen = () => {
  const partDefinitionStatsById = Object.fromEntries(
    partDefinitions.map((partDefinition) => {
      const matchingInstances = partInstancesWithStatus.filter(
        ({ partInstance }) => partInstance.partDefinitionId === partDefinition.id,
      );
      const count = matchingInstances.reduce(
        (sum, { partInstance }) => sum + partInstance.quantity,
        0,
      );
      const spares = matchingInstances
        .filter(({ status }) => status === "available")
        .reduce((sum, { partInstance }) => sum + partInstance.quantity, 0);

      return [partDefinition.id, { count, spares }];
    }),
  ) as Record<string, { count: number; spares: number }>;
  const visibleInstanceCount = filteredPartInstances.reduce(
    (sum, { partInstance }) => sum + partInstance.quantity,
    0,
  );
  const visibleSpareCount = filteredPartInstances
    .filter(({ status }) => status === "available")
    .reduce((sum, { partInstance }) => sum + partInstance.quantity, 0);

  return (
    <WorkspacePanel
      title="Part manager"
      subtitle="Definition catalog on top with subsystem part instances and lifecycle state below."
      actions={
        <Pressable onPress={openCreatePartDefinitionEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
        </Pressable>
      }
    >
      <FilterToolbar>
        <SearchField
          onChangeText={setPartsSearch}
          placeholder="Search parts"
          value={partsSearch}
        />

        <OptionChipRow
          allLabel="All subsystems"
          onChange={setPartsSubsystemFilter}
          options={subsystems.map((subsystem) => ({
            id: subsystem.id,
            name: subsystem.name,
          }))}
          value={partsSubsystemFilter}
        />

        <OptionChipRow
          allLabel="All statuses"
          onChange={setPartsStatusFilter}
          options={PART_STATUS_OPTIONS}
          value={partsStatusFilter}
        />
      </FilterToolbar>

      <SummaryRow
        chips={[
          { label: "Definitions", value: String(filteredPartDefinitions.length) },
          { label: "Instances", value: String(visibleInstanceCount) },
          { label: "Spares", value: String(visibleSpareCount) },
        ]}
      />

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Part definitions</Text>
      {filteredPartDefinitions.map((partDefinition) => {
        const stats = partDefinitionStatsById[partDefinition.id] ?? {
          count: 0,
          spares: 0,
        };

        return (
          <Pressable
            key={partDefinition.id}
            onPress={() => openEditPartDefinitionEditor(partDefinition.id)}
            style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
          >
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{partDefinition.name}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {partDefinition.partNumber} - rev {partDefinition.revision}
                </Text>
              </View>
              <Text style={editTagStyle}>EDIT</Text>
            </View>

            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              Source {partDefinition.source} | Count {stats.count} | Spares {stats.spares}
            </Text>
          </Pressable>
        );
      })}

      <Text style={[styles.subsectionLabel, appResponsiveStyles.subsectionLabel]}>Part instances</Text>
      {filteredPartInstances.map(({ partInstance, status }) => {
        const definition = partDefinitionsById[partInstance.partDefinitionId];
        const mechanismName = partInstance.mechanismId
          ? (mechanismsById[partInstance.mechanismId]?.name ?? "Unknown mechanism")
          : "Unassigned";
        const subsystemName = subsystemsById[partInstance.subsystemId]?.name ?? "Unknown";

        return (
          <View key={partInstance.id} style={[styles.queueRowCard, appResponsiveStyles.rowCard]}>
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{partInstance.name}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {definition?.name ?? "Unknown definition"} - {subsystemName}
                </Text>
              </View>
              <StatusPill label={status} value={status} />
            </View>

            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              Mechanism {mechanismName} | Qty {partInstance.quantity}
            </Text>
            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              Tracking {partInstance.trackIndividually ? "Individual" : "Bulk"}
            </Text>
          </View>
        );
      })}

      {filteredPartDefinitions.length === 0 && filteredPartInstances.length === 0 ? (
        <EmptyState text="No parts match the current filters." />
      ) : null}

      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.parts} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
