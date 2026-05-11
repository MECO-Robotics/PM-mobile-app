import { Image, Pressable, ScrollView, View } from "react-native";

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
  PART_STATUS_OPTIONS,
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
import {
  capitalize,
  datePortion,
  formatDate,
  formatDateTime,
  splitList,
  timePortion,
  timelineProgress,
} from "../ui/helpers";
import { LandscapeSubsystemTimeline } from "../ui/LandscapeSubsystemTimeline";
import { styles } from "../ui/styles";
import {
  EmptyState,
  FilterToolbar,
  InteractionNote,
  OptionChipRow,
  SearchField,
  SectionTabs,
  StatusPill,
  SummaryRow,
  WorkspacePanel,
} from "../ui/ui";
import type { ArchiveFilterMode } from "../ui/types";

import type { AppScreenProps } from "./types";
import { AttendanceStatusMark } from "./AttendanceStatusMark";

export function InventoryPurchasesScreen(props: AppScreenProps) {
  const {
    appResponsiveStyles,
    editTagStyle,
    filteredMaterialRollups,
    filteredPartDefinitions,
    filteredPartInstances,
    filteredPurchases,
    inventoryView,
    materialsCategoryFilter,
    materialsSearch,
    materialsStockFilter,
    mechanismsById,
    members,
    membersById,
    openCreatePartDefinitionEditor,
    openCreatePurchaseEditor,
    openEditPartDefinitionEditor,
    openEditPurchaseEditor,
    openMaterialRestockEditor,
    partDefinitions,
    partDefinitionsById,
    partInstancesWithStatus,
    partsSearch,
    partsStatusFilter,
    partsSubsystemFilter,
    purchaseApprovalFilter,
    purchaseArchiveFilter,
    purchaseRequesterFilter,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSubsystemFilter,
    purchaseVendorFilter,
    purchaseVendorOptions,
    setMaterialsCategoryFilter,
    setMaterialsSearch,
    setMaterialsStockFilter,
    setPartsSearch,
    setPartsStatusFilter,
    setPartsSubsystemFilter,
    setPurchaseApprovalFilter,
    setPurchaseArchiveFilter,
    setPurchaseRequesterFilter,
    setPurchaseSearch,
    setPurchaseStatusFilter,
    setPurchaseSubsystemFilter,
    setPurchaseVendorFilter,
    subsystems,
    subsystemsById,
  } = props;

const renderScreen = () => {
  return (
    <WorkspacePanel
      title="Purchase list"
      subtitle="Review request status, vendor, mentor approval, and cost deltas in one queue."
      actions={
        <Pressable onPress={openCreatePurchaseEditor} style={[styles.primaryAction, appResponsiveStyles.primaryAction]}>
          <Text style={[styles.primaryActionLabel, appResponsiveStyles.primaryActionLabel]}>Add</Text>
        </Pressable>
      }
    >
      <FilterToolbar>
        <SearchField
          onChangeText={setPurchaseSearch}
          placeholder="Search purchases"
          value={purchaseSearch}
        />

        <OptionChipRow
          allLabel="All subsystems"
          onChange={setPurchaseSubsystemFilter}
          options={subsystems.map((subsystem) => ({
            id: subsystem.id,
            name: subsystem.name,
          }))}
          value={purchaseSubsystemFilter}
        />

        <OptionChipRow
          allLabel="All requesters"
          onChange={setPurchaseRequesterFilter}
          options={members.map((member) => ({
            id: member.id,
            name: member.name,
          }))}
          value={purchaseRequesterFilter}
        />

        <OptionChipRow
          allLabel="All statuses"
          onChange={setPurchaseStatusFilter}
          options={PURCHASE_STATUS_OPTIONS}
          value={purchaseStatusFilter}
        />

        <OptionChipRow
          allLabel="All vendors"
          onChange={setPurchaseVendorFilter}
          options={purchaseVendorOptions}
          value={purchaseVendorFilter}
        />

        <OptionChipRow
          allLabel="All approvals"
          onChange={setPurchaseApprovalFilter}
          options={PURCHASE_APPROVAL_OPTIONS}
          value={purchaseApprovalFilter}
        />

        <OptionChipRow
          allLabel="Any archive"
          onChange={(value) => setPurchaseArchiveFilter(value as ArchiveFilterMode)}
          options={ARCHIVE_FILTER_OPTIONS}
          value={purchaseArchiveFilter}
        />
      </FilterToolbar>

      {filteredPurchases.map((item) => {
        const subsystemName = subsystemsById[item.subsystemId]?.name ?? "Unknown";
        const requesterName = item.requestedById
          ? (membersById[item.requestedById]?.name ?? "Unassigned")
          : "Unassigned";

        return (
          <Pressable
            key={item.id}
            onPress={() => openEditPurchaseEditor(item)}
            style={[styles.queueRowCard, appResponsiveStyles.rowCard]}
          >
            <View style={styles.queueRowHeader}>
              <View style={styles.queueRowPrimaryText}>
                <Text style={[styles.queueRowTitle, appResponsiveStyles.rowTitle]}>{item.title}</Text>
                <Text style={[styles.queueRowSubtitle, appResponsiveStyles.rowSubtitle]}>
                  {subsystemName} - requester {requesterName}
                </Text>
              </View>
              <Text style={editTagStyle}>EDIT</Text>
            </View>

            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              Vendor {item.vendor} | Qty {item.quantity}
            </Text>
            <Text style={[styles.queueMetaLine, appResponsiveStyles.metaLine]}>
              Est ${item.estimatedCost.toFixed(0)} | Final {item.finalCost ? `$${item.finalCost.toFixed(0)}` : "pending"}
            </Text>

            <View style={styles.queuePillRow}>
              <StatusPill label={item.status} value={item.status} />
              <StatusPill
                label={item.approvedByMentor ? "Mentor approved" : "Mentor waiting"}
                value={item.approvedByMentor ? "approved" : "waiting"}
              />
            </View>
          </Pressable>
        );
      })}

      {filteredPurchases.length === 0 ? (
        <EmptyState text="No purchase items match the current filters." />
      ) : null}

      <InteractionNote steps={SUBVIEW_INTERACTION_GUIDANCE.purchases} />
    </WorkspacePanel>
  );
};

  return renderScreen();
}
