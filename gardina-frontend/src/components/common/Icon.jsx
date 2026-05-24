import { HugeiconsIcon } from '@hugeicons/react';
import {
  // People & Users
  User02Icon, UserGroupIcon, UserSearch01Icon, UserRemove01Icon,
  UserAdd01Icon, IdIcon, CustomerService01Icon,

  // Auth & Security
  LockIcon, LockPasswordIcon, LockKeyIcon, Logout01Icon,

  // Notifications & Alerts
  Notification01Icon, Notification02Icon, NotificationOff01Icon,
  AlarmClockIcon, Alert01Icon, AlertCircleIcon,

  // Actions
  Add01Icon, AddCircleIcon, Cancel01Icon, Edit01Icon,
  Delete01Icon, FloppyDiskIcon, Search01Icon, RefreshIcon,
  Download01Icon, Share01Icon, PrinterIcon, FilterHorizontalIcon,
  ZoomInAreaIcon, ArrowUpDownIcon, TickDoubleIcon,

  // Navigation
  ArrowLeft01Icon, ArrowRight01Icon, ArrowDown01Icon, ArrowUp01Icon,

  // Status
  Tick01Icon, CheckmarkCircleIcon, CheckmarkBadge01Icon,
  InformationCircleIcon, StarIcon,

  // Home & Navigation
  Home01Icon, DashboardSquare01Icon, SmartPhone01Icon,
  Location01Icon, Location04Icon, MapPinIcon,

  // Communication
  Message01Icon, Call02Icon, Mail01Icon, MailSend01Icon,

  // Calendar & Time
  Calendar01Icon, Calendar02Icon, Clock01Icon,

  // Commerce & Finance
  Payment01Icon, MoneyBag01Icon, ShoppingCart01Icon,
  ReceiptCentIcon, PercentIcon, StoreIcon,

  // Media
  Camera01Icon, Image01Icon, ImageNotFound01Icon, ImageUploadIcon,
  PlayIcon, PlayCircleIcon, ViewIcon, ViewOffIcon,

  // Analytics & Charts
  BarChartIcon, Analytics01Icon,

  // Files & Folders
  FolderOpenIcon, Folder01Icon, Note01Icon, AgreementIcon,
  Task01Icon, ListViewIcon, NoteEditIcon,

  // Settings & Tools
  Settings01Icon, CalculatorIcon, RulerIcon, WrenchIcon,

  // Design
  PaintBrush01Icon,

  // Inventory & Items
  Package01Icon, GridViewIcon,

  // Misc / Special
  HelpCircleIcon, WebhookIcon, Link01Icon, Unlink01Icon, FireIcon,
  Sun01Icon, Door01Icon, WorkflowCircle01Icon,
  BatteryFullIcon, SignalFullIcon, CrownIcon, Diamond01Icon,
  InputCursorTextIcon,

  // Room & Furniture types (for measurement/fabric screens)
  BedIcon, DeskIcon, SofaIcon, RestaurantIcon, ConferenceIcon,
  TerraceIcon, FactoryIcon, EntranceStairsIcon, HomeIcon,

  // Window/curtain types
  BlindsIcon, CurtainsIcon,

  // Delivery
  TruckIcon,

  // Baby/Child
  BabyIcon,

  // Sewing/fabric
  ThreadIcon,
} from '@hugeicons/core-free-icons';

/**
 * Complete mapping: Material Symbols icon name → Hugeicons icon data
 */
const ICON_MAP = {
  // ── People & Auth ─────────────────────────────────────────────────
  person:                   User02Icon,
  person_off:               UserRemove01Icon,
  person_search:            UserSearch01Icon,
  group:                    UserGroupIcon,
  groups:                   UserGroupIcon,
  people:                   UserGroupIcon,
  badge:                    IdIcon,
  support_agent:            CustomerService01Icon,
  admin_panel_settings:     Settings01Icon,

  // ── Actions ───────────────────────────────────────────────────────
  add:                      Add01Icon,
  add_circle:               AddCircleIcon,
  close:                    Cancel01Icon,
  cancel:                   Cancel01Icon,
  delete:                   Delete01Icon,
  delete_forever:           Delete01Icon,
  edit:                     Edit01Icon,
  save:                     FloppyDiskIcon,
  search:                   Search01Icon,
  refresh:                  RefreshIcon,
  sync:                     RefreshIcon,
  download:                 Download01Icon,
  share:                    Share01Icon,
  ios_share:                Share01Icon,
  print:                    PrinterIcon,
  filter_alt:               FilterHorizontalIcon,
  zoom_in:                  ZoomInAreaIcon,
  open_in_new:              Link01Icon,
  link:                     Link01Icon,
  swap_horiz:               ArrowUpDownIcon,

  // ── Navigation & Arrows ───────────────────────────────────────────
  arrow_back:               ArrowLeft01Icon,
  arrow_back_ios:           ArrowLeft01Icon,
  arrow_forward:            ArrowRight01Icon,
  arrow_downward:           ArrowDown01Icon,
  expand_more:              ArrowDown01Icon,
  chevron_right:            ArrowRight01Icon,

  // ── Auth & Security ───────────────────────────────────────────────
  lock:                     LockIcon,
  logout:                   Logout01Icon,
  verified:                 CheckmarkBadge01Icon,
  verified_user:            CheckmarkBadge01Icon,

  // ── Status & Feedback ─────────────────────────────────────────────
  check:                    Tick01Icon,
  check_circle:             CheckmarkCircleIcon,
  task_alt:                 CheckmarkCircleIcon,
  done_all:                 TickDoubleIcon,
  error:                    AlertCircleIcon,
  warning:                  Alert01Icon,
  info:                     InformationCircleIcon,
  block:                    Cancel01Icon,
  priority_high:            Alert01Icon,
  star:                     StarIcon,
  stars:                    StarIcon,

  // ── Notifications ─────────────────────────────────────────────────
  notifications:            Notification01Icon,
  notifications_active:     Notification02Icon,
  notifications_off:        NotificationOff01Icon,
  alarm:                    AlarmClockIcon,

  // ── Media & Images ────────────────────────────────────────────────
  photo_camera:             Camera01Icon,
  add_a_photo:              Camera01Icon,
  add_photo_alternate:      ImageUploadIcon,
  image:                    Image01Icon,
  image_not_supported:      ImageNotFound01Icon,
  play_arrow:               PlayIcon,
  play_circle:              PlayCircleIcon,
  visibility:               ViewIcon,
  visibility_off:           ViewOffIcon,

  // ── Home & Navigation ─────────────────────────────────────────────
  home:                     Home01Icon,
  add_home:                 Home01Icon,
  other_houses:             HomeIcon,
  dashboard:                DashboardSquare01Icon,
  install_mobile:           SmartPhone01Icon,
  near_me:                  Location04Icon,

  // ── Communication ─────────────────────────────────────────────────
  chat:                     Message01Icon,
  call:                     Call02Icon,
  phone:                    Call02Icon,
  mail:                     Mail01Icon,
  send:                     MailSend01Icon,
  mark_email_unread:        MailSend01Icon,

  // ── Calendar & Time ───────────────────────────────────────────────
  calendar_today:           Calendar01Icon,
  calendar_month:           Calendar02Icon,
  date_range:               Calendar02Icon,
  event:                    Calendar01Icon,
  event_available:          Calendar01Icon,
  event_busy:               Calendar02Icon,
  schedule:                 Clock01Icon,
  today:                    Calendar01Icon,

  // ── Commerce & Finance ────────────────────────────────────────────
  payments:                 Payment01Icon,
  attach_money:             MoneyBag01Icon,
  account_balance_wallet:   MoneyBag01Icon,
  shopping_cart:            ShoppingCart01Icon,
  add_shopping_cart:        ShoppingCart01Icon,
  receipt_long:             ReceiptCentIcon,
  handshake:                CustomerService01Icon,
  percent:                  PercentIcon,
  store:                    StoreIcon,
  storefront:               StoreIcon,
  business:                 StoreIcon,
  group_add:                UserAdd01Icon,

  // ── Files & Tasks ─────────────────────────────────────────────────
  folder_open:              FolderOpenIcon,
  description:              Folder01Icon,
  note:                     Note01Icon,
  edit_note:                NoteEditIcon,
  inbox:                    Download01Icon,
  assignment:               Task01Icon,
  task:                     Task01Icon,
  contract_edit:            AgreementIcon,
  view_agenda:              ListViewIcon,

  // ── Analytics & Charts ────────────────────────────────────────────
  bar_chart:                BarChartIcon,
  show_chart:               Analytics01Icon,
  analytics:                Analytics01Icon,
  monitoring:               Analytics01Icon,
  timeline:                 Analytics01Icon,

  // ── Location ──────────────────────────────────────────────────────
  location_on:              Location01Icon,
  map:                      MapPinIcon,

  // ── Design ────────────────────────────────────────────────────────
  palette:                  PaintBrush01Icon,
  brush:                    PaintBrush01Icon,
  design_services:          PaintBrush01Icon,
  texture:                  PaintBrush01Icon,
  gradient:                 PaintBrush01Icon,

  // ── Inventory & Items ─────────────────────────────────────────────
  inventory:                Package01Icon,
  inventory_2:              Package01Icon,
  category:                 GridViewIcon,
  grid_view:                GridViewIcon,

  // ── Room & Furniture types ────────────────────────────────────────
  bed:                      BedIcon,
  desk:                     DeskIcon,
  weekend:                  SofaIcon,
  restaurant:               RestaurantIcon,
  kitchen:                  RestaurantIcon,
  meeting_room:             ConferenceIcon,
  balcony:                  TerraceIcon,
  factory:                  FactoryIcon,
  precision_manufacturing:  FactoryIcon,
  stairs:                   EntranceStairsIcon,
  construction:             WrenchIcon,
  handyman:                 WrenchIcon,
  build:                    WrenchIcon,
  height:                   RulerIcon,

  // ── Window/Curtain types ──────────────────────────────────────────
  blinds:                   BlindsIcon,
  roller_shades:            BlindsIcon,
  vertical_shades:          BlindsIcon,
  curtains:                 CurtainsIcon,
  window:                   BlindsIcon,
  door_front:               Door01Icon,
  door_sliding:             Door01Icon,

  // ── Delivery ──────────────────────────────────────────────────────
  local_shipping:           TruckIcon,

  // ── Misc ──────────────────────────────────────────────────────────
  settings:                 Settings01Icon,
  help:                     HelpCircleIcon,
  calculate:                CalculatorIcon,
  straighten:               RulerIcon,
  horizontal_rule:          ArrowUpDownIcon,
  cut:                      Cancel01Icon,
  do_not_disturb_on:        NotificationOff01Icon,
  light_mode:               Sun01Icon,
  local_fire_department:    FireIcon,
  webhook:                  WebhookIcon,
  width:                    RulerIcon,
  child_care:               BabyIcon,
  battery_full:             BatteryFullIcon,
  signal_cellular_alt:      SignalFullIcon,
  workspace_premium:        CrownIcon,
  link_off:                 Unlink01Icon,
  input:                    InputCursorTextIcon,
  sewing_kit:               ThreadIcon,
};

/**
 * Drop-in replacement for Material Symbols icons.
 *
 * Usage:
 *   <Icon name="person" size={24} className="text-primary" />
 *
 * Props:
 *   name        — Material Symbols icon name (snake_case)
 *   size        — icon size in px (default 22)
 *   className   — Tailwind / CSS classes (color, margin, etc.)
 *   strokeWidth — stroke width (default 1.5)
 *   style       — inline style object
 */
const Icon = ({ name, size = 22, className = '', strokeWidth = 1.5, style }) => {
  const iconData = ICON_MAP[name];

  if (!iconData) {
    if (import.meta.env?.DEV) {
      console.warn(`[Icon] Unknown icon: "${name}"`);
    }
    return (
      <span
        style={{ display: 'inline-block', width: size, height: size, ...style }}
        className={className}
      />
    );
  }

  return (
    <HugeiconsIcon
      icon={iconData}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      color="currentColor"
    />
  );
};

export default Icon;
