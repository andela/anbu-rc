import { ProductDetailContainer } from "../containers";
import { isRevisionControlEnabled } from "/imports/plugins/core/revisions/lib/api";

Template.productDetailSimple.helpers({
  isEnabled() {
    return isRevisionControlEnabled();
  },
  PDC() {
    return ProductDetailContainer;
  }
});
Template.disqus.helpers({
  getDisqus() {
    const d = document;
    const s = d.createElement("script");
    s.src = "//anbu-rc.disqus.com/embed.js";
    s.setAttribute("data-timestamp", +new Date());
    (d.head || d.body).appendChild(s);
  }
});
