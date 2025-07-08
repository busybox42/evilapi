// ui utils

export function toggleView(viewId) {
  document.querySelectorAll(".content-view").forEach((view) => {
    view.classList.add("hidden");
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hidden");
  } else {
    console.error(`View with id ${viewId} not found.`);
  }
}