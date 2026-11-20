import { createRouter, createWebHashHistory } from "vue-router";

export const ROUTE_NAME = {
  studio: "studio",
} as const;

const router = createRouter({
  // Hash history: behind HA ingress the path prefix changes per session, the hash part does not.
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: ROUTE_NAME.studio,
      component: () => import("@/views/StudioView.vue"),
    },
  ],
});

export default router;
