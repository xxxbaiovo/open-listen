<script lang="ts">
  import Tab from '@/components/base/Tab.svelte'
  import { viewIcons, viewTypes } from './shared'
  import { t } from '@/plugins/i18n'
  import HeaderActions from './HeaderActions.svelte'
  let { activeview }: { activeview: (typeof viewTypes)[number] } = $props()
  const typeList = $derived(
    viewTypes.map((view) => {
      return {
        id: view,
        href: `/settings?type=extensions&view=${view}`,
        label: $t(`extension__type_${view}`),
        icon: viewIcons[view],
      }
    })
  )
</script>

<header class="header">
  <Tab list={typeList} itemkey="id" itemlabel="label" itemicon="icon" value={activeview} tagname="a" href="href" />
  <HeaderActions />
</header>

<style lang="less">
  .header {
    display: flex;
    flex: none;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 16px;
    padding: 0 16px;
  }
</style>
