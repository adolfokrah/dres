import type { Payload } from 'payload'

export const seedHeader = async (payload: Payload): Promise<void> => {
  console.log('Seeding Header...')

  try {
    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          // New In
          {
            label: 'New In',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?sort=newest',
              label: 'New In',
            },
            subItems: [],
          },
          // Designers
          {
            label: 'Designers',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/designers',
              label: 'Designers',
            },
            subItems: [],
          },
          // Women
          {
            label: 'Women',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/women',
              label: 'Women',
            },
            subItems: [
              {
                label: 'Clothing',
                link: {
                  type: 'custom',
                  url: '/women/clothing',
                  label: 'Clothing',
                },
                featured: true,
                subItems: [
                  {
                    label: 'Coats',
                    link: {
                      type: 'custom',
                      url: '/discover/products?department=women&collection=clothing&category=coats',
                      label: 'Coats',
                    },
                  },
                  {
                    label: 'Jackets',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/jackets',
                      label: 'Jackets',
                    },
                  },
                  {
                    label: 'Dresses',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/dresses',
                      label: 'Dresses',
                    },
                  },
                  {
                    label: 'Tops',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/tops',
                      label: 'Tops',
                    },
                  },
                  {
                    label: 'Trousers',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/trousers',
                      label: 'Trousers',
                    },
                  },
                  {
                    label: 'Skirts',
                    link: {
                      type: 'custom',
                      url: '/women/clothing/skirts',
                      label: 'Skirts',
                    },
                  },
                ],
              },
              {
                label: 'Shoes',
                link: {
                  type: 'custom',
                  url: '/women/shoes',
                  label: 'Shoes',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Trainers',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/trainers',
                      label: 'Trainers',
                    },
                  },
                  {
                    label: 'Boots',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/boots',
                      label: 'Boots',
                    },
                  },
                  {
                    label: 'Sandals',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/sandals',
                      label: 'Sandals',
                    },
                  },
                  {
                    label: 'Heels',
                    link: {
                      type: 'custom',
                      url: '/women/shoes/heels',
                      label: 'Heels',
                    },
                  },
                ],
              },
              {
                label: 'Bags & Accessories',
                link: {
                  type: 'custom',
                  url: '/women/bags-accessories',
                  label: 'Bags & Accessories',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Handbags',
                    link: {
                      type: 'custom',
                      url: '/women/bags/handbags',
                      label: 'Handbags',
                    },
                  },
                  {
                    label: 'Shoulder Bags',
                    link: {
                      type: 'custom',
                      url: '/women/bags/shoulder-bags',
                      label: 'Shoulder Bags',
                    },
                  },
                  {
                    label: 'Clutches',
                    link: {
                      type: 'custom',
                      url: '/women/bags/clutches',
                      label: 'Clutches',
                    },
                  },
                  {
                    label: 'Jewellery',
                    link: {
                      type: 'custom',
                      url: '/women/accessories/jewellery',
                      label: 'Jewellery',
                    },
                  },
                  {
                    label: 'Sunglasses',
                    link: {
                      type: 'custom',
                      url: '/women/accessories/sunglasses',
                      label: 'Sunglasses',
                    },
                  },
                ],
              },
            ],
          },
          // Men
          {
            label: 'Men',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/men',
              label: 'Men',
            },
            subItems: [
              {
                label: 'Clothing',
                link: {
                  type: 'custom',
                  url: '/men/clothing',
                  label: 'Clothing',
                },
                featured: true,
                subItems: [
                  {
                    label: 'Coats',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/coats',
                      label: 'Coats',
                    },
                  },
                  {
                    label: 'Jackets',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/jackets',
                      label: 'Jackets',
                    },
                  },
                  {
                    label: 'Shirts',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/shirts',
                      label: 'Shirts',
                    },
                  },
                  {
                    label: 'T-shirts',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/tshirts',
                      label: 'T-shirts',
                    },
                  },
                  {
                    label: 'Trousers',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/trousers',
                      label: 'Trousers',
                    },
                  },
                  {
                    label: 'Jeans',
                    link: {
                      type: 'custom',
                      url: '/men/clothing/jeans',
                      label: 'Jeans',
                    },
                  },
                ],
              },
              {
                label: 'Shoes',
                link: {
                  type: 'custom',
                  url: '/men/shoes',
                  label: 'Shoes',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Trainers',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/trainers',
                      label: 'Trainers',
                    },
                  },
                  {
                    label: 'Boots',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/boots',
                      label: 'Boots',
                    },
                  },
                  {
                    label: 'Formal Shoes',
                    link: {
                      type: 'custom',
                      url: '/men/shoes/formal',
                      label: 'Formal Shoes',
                    },
                  },
                ],
              },
              {
                label: 'Accessories',
                link: {
                  type: 'custom',
                  url: '/men/accessories',
                  label: 'Accessories',
                },
                featured: false,
                subItems: [
                  {
                    label: 'Bags',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/bags',
                      label: 'Bags',
                    },
                  },
                  {
                    label: 'Watches',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/watches',
                      label: 'Watches',
                    },
                  },
                  {
                    label: 'Sunglasses',
                    link: {
                      type: 'custom',
                      url: '/men/accessories/sunglasses',
                      label: 'Sunglasses',
                    },
                  },
                ],
              },
            ],
          },
          // We Love
          {
            label: 'We Love',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?featured=true',
              label: 'We Love',
            },
            subItems: [],
          },
          // Vintage
          {
            label: 'Vintage',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?vintage=true',
              label: 'Vintage',
            },
            subItems: [],
          },
          // Bags
          {
            label: 'Bags',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?collection=bags',
              label: 'Bags',
            },
            subItems: [
              {
                label: 'Handbags',
                link: {
                  type: 'custom',
                  url: '/bags/handbags',
                  label: 'Handbags',
                },
                featured: false,
              },
              {
                label: 'Shoulder Bags',
                link: {
                  type: 'custom',
                  url: '/bags/shoulder-bags',
                  label: 'Shoulder Bags',
                },
                featured: false,
              },
              {
                label: 'Crossbody Bags',
                link: {
                  type: 'custom',
                  url: '/bags/crossbody',
                  label: 'Crossbody Bags',
                },
                featured: false,
              },
              {
                label: 'Tote Bags',
                link: {
                  type: 'custom',
                  url: '/bags/tote',
                  label: 'Tote Bags',
                },
                featured: false,
              },
              {
                label: 'Backpacks',
                link: {
                  type: 'custom',
                  url: '/bags/backpacks',
                  label: 'Backpacks',
                },
                featured: false,
              },
            ],
          },
          // Watches & Jewellery
          {
            label: 'Watches & Jewellery',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/discover/products?collection=watches-jewellery',
              label: 'Watches & Jewellery',
            },
            subItems: [
              {
                label: 'Watches',
                link: {
                  type: 'custom',
                  url: '/watches',
                  label: 'Watches',
                },
                featured: true,
              },
              {
                label: 'Necklaces',
                link: {
                  type: 'custom',
                  url: '/jewellery/necklaces',
                  label: 'Necklaces',
                },
                featured: false,
              },
              {
                label: 'Bracelets',
                link: {
                  type: 'custom',
                  url: '/jewellery/bracelets',
                  label: 'Bracelets',
                },
                featured: false,
              },
              {
                label: 'Rings',
                link: {
                  type: 'custom',
                  url: '/jewellery/rings',
                  label: 'Rings',
                },
                featured: false,
              },
              {
                label: 'Earrings',
                link: {
                  type: 'custom',
                  url: '/jewellery/earrings',
                  label: 'Earrings',
                },
                featured: false,
              },
            ],
          },
          // Children
          {
            label: 'Children',
            highlighted: false,
            link: {
              type: 'custom',
              url: '/kids',
              label: 'Children',
            },
            subItems: [
              {
                label: 'Girls',
                link: {
                  type: 'custom',
                  url: '/kids/girls',
                  label: 'Girls',
                },
                featured: false,
              },
              {
                label: 'Boys',
                link: {
                  type: 'custom',
                  url: '/kids/boys',
                  label: 'Boys',
                },
                featured: false,
              },
              {
                label: 'Baby',
                link: {
                  type: 'custom',
                  url: '/kids/baby',
                  label: 'Baby',
                },
                featured: false,
              },
            ],
          },
          // Sale
          {
            label: 'Sale',
            highlighted: true,
            link: {
              type: 'custom',
              url: '/discover/products?sale=true',
              label: 'Sale',
            },
            subItems: [],
          },
        ],
      },
    })

    console.log('✅ Header seeded successfully')
  } catch (error) {
    console.error('Error seeding header:', error)
    throw error
  }
}
